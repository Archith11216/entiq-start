import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.seed import seed_database

# Create an in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

MASTER_KEY = "entiq_live_sec_7f9c2d1b8e4a3f0"
client = TestClient(app, headers={"X-API-Key": MASTER_KEY})
unauth_client = TestClient(app)

def test_api_key_enforcement():
    # Calling protected endpoint without API key must return 401
    res = unauth_client.get("/api/v1/cases")
    assert res.status_code == 401
    assert "API Key required" in res.json()["detail"]

    # Calling with invalid API key must return 401
    bad_res = unauth_client.get("/api/v1/cases", headers={"X-API-Key": "invalid_key_12345"})
    assert bad_res.status_code == 401
    assert "Invalid or revoked API Key" in bad_res.json()["detail"]

    # Calling with master key succeeds
    good_res = client.get("/api/v1/cases")
    assert good_res.status_code == 200

def test_health():
    res = unauth_client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}

def test_auth_login_and_me():
    # 1. Login with seeded user
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "j.okafor@growadvisory.com.au", "password": "password123"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "accessToken" in data
    assert "refreshToken" in data
    assert data["tokenType"] == "Bearer"

    token = data["accessToken"]

    # 2. Query /auth/me
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["email"] == "j.okafor@growadvisory.com.au"
    assert profile["displayName"] == "J. Okafor"

def test_cases_list_and_filter():
    res = client.get("/api/v1/cases")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 12
    assert len(data["items"]) > 0

    # Test filtering by status
    filtered_res = client.get("/api/v1/cases?status=Accepted")
    assert filtered_res.status_code == 200
    filtered_data = filtered_res.json()
    assert all(c["status"] == "Accepted" for c in filtered_data["items"])

def test_case_status_update_auto_engagement():
    # Update status of an unaccepted case to Accepted
    case_id = "C-2024-0891"
    res = client.patch(
        f"/api/v1/cases/{case_id}/status",
        json={"status": "Accepted"}
    )
    assert res.status_code == 200
    updated = res.json()
    assert updated["status"] == "Accepted"
    assert updated["progress"] == 100

    # Verify engagement was created
    eng_res = client.get(f"/api/v1/engagements?search={updated['client']}")
    assert eng_res.status_code == 200
    assert eng_res.json()["total"] >= 1

def test_alerts_and_dismiss():
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) > 0

    alert_id = alerts[0]["id"]
    dismiss_res = client.post(f"/api/v1/alerts/{alert_id}/dismiss")
    assert dismiss_res.status_code == 204

    # Verify alert is dismissed
    res2 = client.get("/api/v1/alerts")
    remaining_ids = [a["id"] for a in res2.json()]
    assert alert_id not in remaining_ids

def test_dashboard_stats():
    res = client.get("/api/v1/dashboard/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "active" in stats
    assert "overdue" in stats
    assert "accepted" in stats
    assert "conversionData" in stats
    assert "completionTrend" in stats

def test_invitations_flow():
    # 1. List
    list_res = client.get("/api/v1/invitations")
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 7

    # 2. Stats
    stats_res = client.get("/api/v1/invitations/stats")
    assert stats_res.status_code == 200
    assert "sentThisMonth" in stats_res.json()

    # 3. Create
    create_res = client.post(
        "/api/v1/invitations",
        json={
            "clientName": "Test Client Pty Ltd",
            "email": "test@example.com",
            "clientType": "Company",
            "service": "Company Tax",
            "channel": "Email",
            "assignTo": "J. Okafor"
        }
    )
    assert create_res.status_code == 201
    created_inv = create_res.json()
    assert created_inv["client"] == "Test Client Pty Ltd"
    assert created_inv["status"] == "Sent"

    # 4. Resend
    resend_res = client.post(f"/api/v1/invitations/{created_inv['id']}/resend")
    assert resend_res.status_code == 200

    # 5. Cancel
    cancel_res = client.post(f"/api/v1/invitations/{created_inv['id']}/cancel")
    assert cancel_res.status_code == 200

def test_clients_and_templates():
    # Clients
    c_res = client.get("/api/v1/clients")
    assert c_res.status_code == 200
    assert c_res.json()["total"] >= 10

    # Templates
    t_res = client.get("/api/v1/templates")
    assert t_res.status_code == 200
    assert t_res.json()["total"] >= 10

def test_batch_clients_for_trust_and_company():
    # Test creating a Trust alongside its Corporate Trustee company and a Trading company
    entities = [
        {"name": "Elysium Family Trust", "type": "Trust", "abn": "12345678901", "verified": "Document"},
        {"name": "Elysium Trustee Pty Ltd", "type": "Company", "acn": "123456789", "verified": "Document"},
        {"name": "Elysium Trading Pty Ltd", "type": "Company", "acn": "987654321", "verified": "Document"},
    ]
    res = client.post("/api/v1/clients/batch", json=entities)
    assert res.status_code == 201
    created = res.json()
    assert len(created) == 3
    assert created[0]["type"] == "Trust"
    assert created[1]["type"] == "Company"
    assert created[2]["type"] == "Company"

def test_invitation_with_multiple_companies():
    # Test inviting a Trust with multiple companies
    res = client.post(
        "/api/v1/invitations",
        json={
            "clientName": "The Quantum Family Trust",
            "email": "trustee@quantum.com.au",
            "clientType": "Trust",
            "service": "Trust Tax",
            "channel": "Email",
            "assignTo": "J. Okafor",
            "additionalCompanies": [
                {"name": "Quantum Trustee Pty Ltd", "role": "Corporate Trustee"},
                {"name": "Quantum Operations Pty Ltd", "role": "Operating Entity"}
            ]
        }
    )
    assert res.status_code == 201
    inv = res.json()
    assert inv["client"] == "The Quantum Family Trust"

    # Verify that onboarding cases were created for the Trust and each company
    case_res = client.get("/api/v1/cases?search=Quantum")
    assert case_res.status_code == 200
    cases = case_res.json()
    assert cases["total"] == 3
    clients_found = [c["client"] for c in cases["items"]]
    assert "The Quantum Family Trust" in clients_found
    assert "Quantum Trustee Pty Ltd" in clients_found
    assert "Quantum Operations Pty Ltd" in clients_found

def test_client_update_and_delete():
    # 1. Create a client
    create_res = client.post(
        "/api/v1/clients",
        json={
            "name": "Test Entity To Update",
            "type": "Company",
            "abn": "11223344556",
            "acn": "112233445",
            "verified": "Document"
        }
    )
    assert create_res.status_code == 201
    created = create_res.json()
    c_id = created["id"]

    # 2. Update the client
    update_res = client.put(
        f"/api/v1/clients/{c_id}",
        json={
            "name": "Updated Entity Name Pty Ltd",
            "type": "Company",
            "abn": "99887766554",
            "acn": "998877665",
            "verified": "Biometric (KYC)",
            "status": "Active"
        }
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["name"] == "Updated Entity Name Pty Ltd"
    assert updated["abn"] == "99887766554"
    assert updated["verified"] == "Biometric (KYC)"

    # 3. Delete the client
    del_res = client.delete(f"/api/v1/clients/{c_id}")
    assert del_res.status_code == 204

    # 4. Verify 404 on deleted
    del_again = client.delete(f"/api/v1/clients/{c_id}")
    assert del_again.status_code == 404

def test_billing_schedules_invoices_payments_and_stats():
    # 1. Stats
    stats_res = client.get("/api/v1/billing/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "totalRevenueYtd" in stats
    assert "activeSchedules" in stats

    # 2. List schedules
    sch_res = client.get("/api/v1/billing/schedules")
    assert sch_res.status_code == 200
    schedules = sch_res.json()
    assert schedules["total"] >= 1
    first_sch_id = schedules["items"][0]["id"]

    # 3. Update schedule status
    up_sch = client.put(f"/api/v1/billing/schedules/{first_sch_id}", json={"status": "Paused"})
    assert up_sch.status_code == 200
    assert up_sch.json()["status"] == "Paused"

    # 4. List invoices
    inv_res = client.get("/api/v1/billing/invoices")
    assert inv_res.status_code == 200
    invoices = inv_res.json()
    assert invoices["total"] >= 1

    # 5. Record payment
    pay_res = client.post(
        "/api/v1/billing/payments",
        json={
            "client": "Manoj Tech Solutions Pty Ltd",
            "amount": 550.0,
            "method": "Credit Card",
            "status": "Settled"
        }
    )
    assert pay_res.status_code == 201
    pay_data = pay_res.json()
    assert pay_data["amount"] == 550.0

    # 6. List payments
    p_list = client.get("/api/v1/billing/payments")
    assert p_list.status_code == 200
    assert p_list.json()["total"] >= 1

def test_services_pricing_and_staff():
    # 1. Services
    svc_res = client.get("/api/v1/services")
    assert svc_res.status_code == 200
    services = svc_res.json()
    assert len(services) >= 1

    # Create new service
    new_svc_res = client.post(
        "/api/v1/services",
        json={
            "name": "Custom Virtual CFO Advisory",
            "description": "Virtual CFO quarterly advisory package",
            "entityTypes": ["Company", "Trust"],
            "scope": "Quarterly board meetings, KPI dashboard, cashflow forecasting",
            "status": "Active"
        }
    )
    assert new_svc_res.status_code == 201
    new_svc = new_svc_res.json()
    assert new_svc["name"] == "Custom Virtual CFO Advisory"

    # 2. Fees
    fees_res = client.get("/api/v1/fees")
    assert fees_res.status_code == 200
    assert len(fees_res.json()) >= 1

    # 3. Staff
    staff_res = client.get("/api/v1/staff")
    assert staff_res.status_code == 200
    assert len(staff_res.json()) >= 1

def test_workflows_persistence():
    # 1. List workflows
    wf_list = client.get("/api/v1/workflows")
    assert wf_list.status_code == 200
    assert len(wf_list.json()) >= 1

    # 2. Save/Update workflow
    update_res = client.put(
        "/api/v1/workflows/default-client-onboarding",
        json={
            "id": "default-client-onboarding",
            "name": "Default Client Onboarding Flow",
            "description": "End-to-end automated client onboarding with KYC, Engagement Letter, and Square Direct Debit",
            "nodesJson": '[{"id":"start","type":"trigger","data":{"label":"Trigger: Invitation Accepted"}}]',
            "edgesJson": '[]',
            "status": "Active"
        }
    )
    assert update_res.status_code == 200
    wf = update_res.json()
    assert "Trigger: Invitation Accepted" in wf["nodesJson"]

def test_api_keys_management():
    # 1. List API Keys
    keys_res = client.get("/api/v1/api-keys")
    assert keys_res.status_code == 200
    keys = keys_res.json()
    assert len(keys) >= 1

    # 2. Create new API Key
    new_key_res = client.post(
        "/api/v1/api-keys",
        json={"name": "Zapier Webhook Key"}
    )
    assert new_key_res.status_code == 201
    created_key = new_key_res.json()
    assert created_key["name"] == "Zapier Webhook Key"
    assert created_key["key"].startswith("entiq_live_")

    # 3. Revoke (deactivate) key
    del_res = client.delete(f"/api/v1/api-keys/{created_key['id']}")
    assert del_res.status_code == 204

def test_invitation_update_and_delete():
    # 1. Create invitation
    create_res = client.post(
        "/api/v1/invitations",
        json={
            "client_name": "Test Invite Update",
            "email": "invite@test.com",
            "service": "Business Advisory",
            "channel": "Email"
        }
    )
    assert create_res.status_code == 201
    inv = create_res.json()
    inv_id = inv["id"]

    # 2. Update invitation
    up_res = client.put(
        f"/api/v1/invitations/{inv_id}",
        json={
            "client": "Test Invite Modified",
            "email": "modified@test.com",
            "status": "Started"
        }
    )
    assert up_res.status_code == 200
    assert up_res.json()["client"] == "Test Invite Modified"
    assert up_res.json()["status"] == "Started"

    # 3. Delete invitation
    del_res = client.delete(f"/api/v1/invitations/{inv_id}")
    assert del_res.status_code == 204

    # 4. Check 404
    del_again = client.delete(f"/api/v1/invitations/{inv_id}")
    assert del_again.status_code == 404

def test_engagement_update_and_delete():
    # 1. Create engagement
    create_res = client.post(
        "/api/v1/engagements",
        json={
            "client": "Engage Test Pty Ltd",
            "service": "Annual Tax Compliance",
            "fee": "$4,500 pa",
            "status": "Proposal issued"
        }
    )
    assert create_res.status_code == 201
    eng = create_res.json()
    eng_id = eng["id"]

    # 2. Update engagement
    up_res = client.put(
        f"/api/v1/engagements/{eng_id}",
        json={
            "client": "Engage Test Pty Ltd - Modified",
            "fee": "$5,200 pa",
            "status": "Active"
        }
    )
    assert up_res.status_code == 200
    assert up_res.json()["fee"] == "$5,200 pa"
    assert up_res.json()["status"] == "Active"

    # 3. Delete engagement
    del_res = client.delete(f"/api/v1/engagements/{eng_id}")
    assert del_res.status_code == 204

    # 4. Check 404
    del_again = client.delete(f"/api/v1/engagements/{eng_id}")
    assert del_again.status_code == 404

def test_invoice_and_payment_update_and_delete():
    # 1. Create invoice
    inv_res = client.post(
        "/api/v1/billing/invoices",
        json={
            "client": "Billing Test Co",
            "service": "Quarterly BAS",
            "amount": 750.0,
            "status": "Draft"
        }
    )
    assert inv_res.status_code == 201
    inv_id = inv_res.json()["id"]

    # 2. Update invoice
    up_inv = client.put(
        f"/api/v1/billing/invoices/{inv_id}",
        json={"amount": 850.0, "status": "Issued"}
    )
    assert up_inv.status_code == 200
    assert up_inv.json()["amount"] == 850.0
    assert up_inv.json()["status"] == "Issued"

    # 3. Delete invoice
    del_inv = client.delete(f"/api/v1/billing/invoices/{inv_id}")
    assert del_inv.status_code == 204

    # 4. Record payment
    pay_res = client.post(
        "/api/v1/billing/payments",
        json={
            "client": "Billing Test Co",
            "amount": 850.0,
            "method": "Square POS"
        }
    )
    assert pay_res.status_code == 201
    pay_id = pay_res.json()["id"]

    # 5. Update payment
    up_pay = client.put(
        f"/api/v1/billing/payments/{pay_id}",
        json={"amount": 900.0, "status": "Settled"}
    )
    assert up_pay.status_code == 200
    assert up_pay.json()["amount"] == 900.0

    # 6. Delete payment
    del_pay = client.delete(f"/api/v1/billing/payments/{pay_id}")
    assert del_pay.status_code == 204

def test_email_config_and_smtp_dispatch(monkeypatch):
    # 1. Get default email config
    res = client.get("/api/v1/invitations/email-config")
    assert res.status_code == 200
    cfg = res.json()
    assert "smtpHost" in cfg
    assert "isConfigured" in cfg

    # 2. Update email config
    update_res = client.put(
        "/api/v1/invitations/email-config",
        json={
            "smtpHost": "smtp.gmail.com",
            "smtpPort": 587,
            "smtpUser": "testadviser@gmail.com",
            "smtpPassword": "abcd efgh ijkl mnop",
            "smtpFromName": "EnTIQ Test Practice",
            "smtpFromEmail": "testadviser@gmail.com"
        }
    )
    assert update_res.status_code == 200
    updated_cfg = update_res.json()
    assert updated_cfg["smtpHost"] == "smtp.gmail.com"
    assert updated_cfg["smtpUser"] == "testadviser@gmail.com"
    assert updated_cfg["smtpPasswordSet"] is True
    assert updated_cfg["isConfigured"] is True

    # 3. Test email endpoint (mock smtplib to simulate success)
    class MockSMTP:
        def __init__(self, host, port, timeout=10):
            pass
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc_val, exc_tb):
            pass
        def ehlo(self):
            pass
        def starttls(self):
            pass
        def login(self, user, password):
            pass
        def sendmail(self, from_addr, to_addrs, msg):
            pass

    import smtplib
    monkeypatch.setattr(smtplib, "SMTP", MockSMTP)

    test_res = client.post(
        "/api/v1/invitations/test-email",
        json={
            "toEmail": "client.test@example.com"
        }
    )
    assert test_res.status_code == 200
    test_json = test_res.json()
    assert test_json["delivered"] is True
    assert "client.test@example.com" in test_json["message"]

    # 4. Create an invitation with live dispatch
    inv_res = client.post(
        "/api/v1/invitations",
        json={
            "clientName": "Email Dispatch Client",
            "email": "recipient@example.com",
            "clientType": "Individual",
            "service": "Individual Tax",
            "channel": "Email"
        }
    )
    assert inv_res.status_code == 201
    assert inv_res.json()["client"] == "Email Dispatch Client"
    assert inv_res.json()["status"] == "Sent"

def test_public_invitation_portal_flow():
    # 1. Create an invitation to test public access
    create_res = client.post(
        "/api/v1/invitations",
        json={
            "clientName": "Portal Test Client",
            "email": "portalclient@example.com",
            "clientType": "Company",
            "service": "Company Tax + Advisory",
            "channel": "Email"
        }
    )
    assert create_res.status_code == 201
    inv_id = create_res.json()["id"]

    # 2. Access public endpoint without any API key headers
    unauthed_client = TestClient(app)
    pub_res = unauthed_client.get(f"/api/v1/invitations/public/{inv_id}")
    assert pub_res.status_code == 200
    pub_data = pub_res.json()
    assert pub_data["client"] == "Portal Test Client"
    assert pub_data["service"] == "Company Tax + Advisory"
    # Auto-updated to Opened
    assert pub_data["status"] == "Opened"

    # 3. Client digitally signs and accepts engagement without auth
    accept_res = unauthed_client.post(f"/api/v1/invitations/public/{inv_id}/accept")
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ok"

    # 4. Verify invitation is Completed
    check_res = unauthed_client.get(f"/api/v1/invitations/public/{inv_id}")
    assert check_res.json()["status"] == "Completed"

    # 5. Check 404 for invalid invitation ID
    bad_res = unauthed_client.get("/api/v1/invitations/public/INV-9999-NOTFOUND")
    assert bad_res.status_code == 404

def test_activity_events_dynamic_timestamps():
    from datetime import datetime, timezone, timedelta
    from backend.app.utils import format_event_time

    # 1. Test format_event_time unit logic
    now_utc = datetime.now(timezone.utc)
    assert format_event_time(now_utc - timedelta(seconds=30)) == "Just now"
    assert format_event_time(now_utc - timedelta(minutes=15)) == "15m ago"
    
    # 2. Test GET /api/v1/activity returns dynamic times and createdAt
    res = client.get("/api/v1/activity")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert len(data["items"]) > 0
    first = data["items"][0]
    assert "id" in first
    assert "time" in first
    assert "createdAt" in first
    # time should not be hardcoded "Just now" for older events
    assert any("Yesterday" in item["time"] or "Sep" in item["time"] or "Jul" in item["time"] for item in data["items"])

    # 3. Test POST /api/v1/activity creates real dynamic timestamp
    post_res = client.post(
        "/api/v1/activity",
        json={
            "action": "Unit test activity",
            "target": "TEST-2026 · Dynamic timestamp check",
            "type": "info"
        }
    )
    assert post_res.status_code == 201
    created_event = post_res.json()
    assert created_event["action"] == "Unit test activity"
    assert created_event["time"] == "Just now"
    assert created_event["createdAt"] is not None


