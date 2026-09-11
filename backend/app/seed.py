from sqlalchemy.orm import Session
from .models import User, OnboardingCase, ReviewAlert, Invitation, ClientEntity, Engagement, ActivityEvent, Template
from .auth import get_password_hash

def seed_database(db: Session):
    # 1. Seed Users
    if db.query(User).count() < 6:
        existing_emails = {u.email for u in db.query(User).all()}
        initial_users = [
            User(id="usr-001", email="j.okafor@growadvisory.com.au", hashed_password=get_password_hash("password123"), first_name="James", last_name="Okafor", display_name="J. Okafor", initials="JO", role="Partner", firm_name="Grow Advisory Group", avatar_url=""),
            User(id="usr-002", email="a.brennan@growadvisory.com.au", hashed_password=get_password_hash("password123"), first_name="Amelia", last_name="Brennan", display_name="A. Brennan", initials="AB", role="Senior Manager", firm_name="Grow Advisory Group", avatar_url=""),
            User(id="usr-003", email="s.patel@growadvisory.com.au", hashed_password=get_password_hash("password123"), first_name="Sanjay", last_name="Patel", display_name="S. Patel", initials="SP", role="Senior Accountant", firm_name="Grow Advisory Group", avatar_url=""),
            User(id="usr-004", email="c.richardson@growadvisory.com.au", hashed_password=get_password_hash("password123"), first_name="Chloe", last_name="Richardson", display_name="C. Richardson", initials="CR", role="Accountant", firm_name="Grow Advisory Group", avatar_url=""),
            User(id="usr-005", email="m.webb@growadvisory.com.au", hashed_password=get_password_hash("password123"), first_name="Marcus", last_name="Webb", display_name="M. Webb", initials="MW", role="Graduate Accountant", firm_name="Grow Advisory Group", avatar_url=""),
            User(id="usr-006", email="l.tran@growadvisory.com.au", hashed_password=get_password_hash("password123"), first_name="Linda", last_name="Tran", display_name="L. Tran", initials="LT", role="Practice Manager", firm_name="Grow Advisory Group", avatar_url=""),
        ]
        for u in initial_users:
            if u.email not in existing_emails:
                db.add(u)
        db.commit()

    # 2. Seed Cases
    if not db.query(OnboardingCase).first():
        cases = [
            OnboardingCase(id="C-2024-0900", client="Manoj Tech Solutions Pty Ltd", entity="Company", service="Company Tax + Advisory", status="Accepted", risk="Low", owner="J. Okafor", created="Today", due="18 Sept", channel="Invitation", progress=100),
            OnboardingCase(id="C-2024-0899", client="Manoj Kumar", entity="Individual", service="Individual Tax", status="Accepted", risk="Low", owner="J. Okafor", created="Today", due="18 Sept", channel="Invitation", progress=100),
            OnboardingCase(id="C-2024-0891", client="Harrington, Sophie", entity="Individual", service="Individual Tax", status="Internal review", risk="Low", owner="J. Okafor", created="22 Jul", due="31 Jul", channel="Invitation", progress=88),
            OnboardingCase(id="C-2024-0890", client="Northfield Holdings Pty Ltd", entity="Company", service="Company Tax + Advisory", status="Acceptance review", risk="Medium", owner="A. Brennan", created="20 Jul", due="28 Jul", channel="QR code", progress=97),
            OnboardingCase(id="C-2024-0889", client="The Marcelline Family Trust", entity="Trust", service="Trust Tax", status="Awaiting others", risk="High", owner="J. Okafor", created="18 Jul", due="25 Jul", channel="Referral", progress=54),
            OnboardingCase(id="C-2024-0888", client="Chen, David & Liu, Wei", entity="Individual group", service="Individual Tax × 2", status="In progress", risk="Low", owner="S. Patel", created="17 Jul", due="30 Jul", channel="Share My EnTIQ", progress=41),
            OnboardingCase(id="C-2024-0887", client="Apex Ventures Pty Ltd", entity="Company", service="Company Tax + BAS", status="Proposal issued", risk="Medium", owner="A. Brennan", created="15 Jul", due="22 Jul", channel="Invitation", progress=72),
            OnboardingCase(id="C-2024-0886", client="Caldwell SMSF", entity="SMSF", service="SMSF Administration", status="Submitted", risk="Low", owner="S. Patel", created="14 Jul", due="21 Jul", channel="Invitation", progress=100),
            OnboardingCase(id="C-2024-0885", client="Greenbrook Unit Trust", entity="Trust", service="Trust Tax + Advisory", status="Accepted", risk="Low", owner="J. Okafor", created="10 Jul", due="18 Jul", channel="Referral", progress=100),
            OnboardingCase(id="C-2024-0884", client="Nguyen, Thanh", entity="Individual", service="Individual Tax", status="Invited", risk="Low", owner="S. Patel", created="28 Jul", due="11 Aug", channel="Invitation", progress=0),
            OnboardingCase(id="C-2024-0883", client="Blackwood & Associates", entity="Partnership", service="Partnership Tax", status="Rejected", risk="High", owner="A. Brennan", created="5 Jul", due="15 Jul", channel="Invitation", progress=100),
            OnboardingCase(id="C-2024-0882", client="Tran, Linh Phuong", entity="Individual", service="Individual Tax", status="In progress", risk="Low", owner="S. Patel", created="25 Jul", due="8 Aug", channel="QR code", progress=28),
        ]
        db.add_all(cases)

    # 3. Seed Alerts
    if not db.query(ReviewAlert).first():
        alerts = [
            ReviewAlert(id="A-001", type="identity", severity="error", case="C-2024-0889", message="Entiq KYC: identity check flagged — document expired 14 July. Review result in Entiq KYC.", age="3d"),
            ReviewAlert(id="A-002", type="commercial", severity="warning", case="C-2024-0890", message="Proposed fee 18% below recommended price — partner approval required", age="1d"),
            ReviewAlert(id="A-003", type="conflict", severity="warning", case="C-2024-0891", message="Potential related-party match detected against existing client Harrington, T.", age="5h"),
            ReviewAlert(id="A-004", type="document", severity="warning", case="C-2024-0887", message="Proposal unsigned — 7 days since issue, no client response", age="7d"),
            ReviewAlert(id="A-005", type="compliance", severity="error", case="C-2024-0889", message="Trust deed date predates beneficiary relationship record by 4 years", age="2d"),
        ]
        db.add_all(alerts)

    # 4. Seed Invitations
    if not db.query(Invitation).first():
        invitations = [
            Invitation(id="INV-2024-0120", client="Manoj Kumar", email="manoj@manojtech.com.au", service="Company Tax + Advisory", channel="Email", status="Sent", sent="Today", expires="18 Sept", owner="J. Okafor"),
            Invitation(id="INV-2024-0112", client="Nguyen, Thanh", email="thanh.nguyen@email.com", service="Individual Tax", channel="Email", status="Sent", sent="28 Jul", expires="11 Aug", owner="S. Patel"),
            Invitation(id="INV-2024-0111", client="Riverside Developments Pty Ltd", email="admin@riverside.com.au", service="Company Tax + BAS", channel="Email", status="Opened", sent="26 Jul", expires="9 Aug", owner="A. Brennan"),
            Invitation(id="INV-2024-0110", client="Morrison, Claire", email="claire.m@outlook.com", service="Individual Tax", channel="SMS + Email", status="Started", sent="24 Jul", expires="7 Aug", owner="J. Okafor"),
            Invitation(id="INV-2024-0109", client="Sunfield Unit Trust", email="trustee@sunfield.com.au", service="Trust Tax", channel="QR code", status="Expired", sent="10 Jul", expires="24 Jul", owner="S. Patel"),
            Invitation(id="INV-2024-0108", client="Park, Ji-Woo", email="jwpark@gmail.com", service="Individual Tax", channel="Email", status="Sent", sent="28 Jul", expires="11 Aug", owner="A. Brennan"),
            Invitation(id="INV-2024-0107", client="Ashworth & Partners", email="info@ashworth.net.au", service="Partnership Tax", channel="Email", status="Completed", sent="18 Jul", expires="1 Aug", owner="J. Okafor"),
        ]
        db.add_all(invitations)

    # 5. Seed Clients
    if not db.query(ClientEntity).first():
        clients = [
            ClientEntity(id="E-00890", name="Manoj Tech Solutions Pty Ltd", type="Company", abn="88 923 104 551", acn="923 104 551", status="Active", verified="Document", cases=1, engagements=1, added="Aug 2026"),
            ClientEntity(id="P-00450", name="Manoj Kumar", type="Individual", abn="", acn="", status="Active", verified="Biometric (KYC)", cases=1, engagements=1, added="Aug 2026"),
            ClientEntity(id="P-00441", name="Harrington, Sophie", type="Individual", abn="", acn="", status="Active", verified="Biometric (KYC)", cases=1, engagements=2, added="Mar 2023"),
            ClientEntity(id="E-00882", name="Northfield Holdings Pty Ltd", type="Company", abn="62 481 203 991", acn="481 203 991", status="Active", verified="Document", cases=1, engagements=1, added="Jan 2024"),
            ClientEntity(id="E-00881", name="The Marcelline Family Trust", type="Trust", abn="51 204 771 003", acn="", status="Active", verified="Manual", cases=1, engagements=1, added="Jun 2023"),
            ClientEntity(id="P-00440", name="Chen, David", type="Individual", abn="", acn="", status="Active", verified="Document", cases=1, engagements=1, added="Feb 2024"),
            ClientEntity(id="P-00439", name="Liu, Wei", type="Individual", abn="", acn="", status="Active", verified="Contact", cases=1, engagements=0, added="Feb 2024"),
            ClientEntity(id="E-00880", name="Apex Ventures Pty Ltd", type="Company", abn="77 340 918 200", acn="340 918 200", status="Active", verified="Document", cases=1, engagements=0, added="Jul 2024"),
            ClientEntity(id="E-00879", name="Caldwell SMSF", type="SMSF", abn="39 204 881 772", acn="", status="Active", verified="Document", cases=1, engagements=1, added="Apr 2022"),
            ClientEntity(id="E-00878", name="Greenbrook Unit Trust", type="Trust", abn="20 781 003 441", acn="", status="Active", verified="Document", cases=1, engagements=1, added="Nov 2021"),
        ]
        db.add_all(clients)

    # 6. Seed Engagements
    if not db.query(Engagement).first():
        engagements = [
            Engagement(id="ENG-2024-0450", client="Manoj Tech Solutions Pty Ltd", service="Company Tax Return (FY25) + R&D Tax Incentive", signed="Today", renewal_due="30 Jun 2027", fee="$6,350 pa", status="Active", adviser="J. Okafor"),
            Engagement(id="ENG-2024-0441", client="Greenbrook Unit Trust", service="Trust Tax + Advisory", signed="18 Jul 2024", renewal_due="30 Jun 2025", fee="$8,800 pa", status="Active", adviser="J. Okafor"),
            Engagement(id="ENG-2024-0440", client="Caldwell SMSF", service="SMSF Administration", signed="14 Jul 2024", renewal_due="30 Jun 2025", fee="$3,300 pa", status="Active", adviser="S. Patel"),
            Engagement(id="ENG-2024-0439", client="Harrington, Sophie", service="Individual Tax", signed="2 Jun 2024", renewal_due="31 May 2025", fee="$1,650 pa", status="Active", adviser="J. Okafor"),
            Engagement(id="ENG-2024-0438", client="Harrington, Sophie", service="Business Advisory", signed="2 Jun 2024", renewal_due="31 May 2025", fee="$6,600 pa", status="Active", adviser="J. Okafor"),
            Engagement(id="ENG-2024-0430", client="Apex Ventures Pty Ltd", service="Company Tax + BAS", signed="", renewal_due="", fee="$4,950 pa", status="Proposal issued", adviser="A. Brennan"),
            Engagement(id="ENG-2023-0391", client="The Marcelline Family Trust", service="Trust Tax", signed="14 Aug 2023", renewal_due="31 Jul 2024", fee="$5,500 pa", status="Renewal due", adviser="J. Okafor"),
            Engagement(id="ENG-2022-0310", client="Blackwood & Associates", service="Partnership Tax", signed="10 Sep 2022", renewal_due="31 Aug 2024", fee="$3,850 pa", status="Terminated", adviser="A. Brennan"),
        ]
        db.add_all(engagements)

    # 7. Seed Activity Events
    if not db.query(ActivityEvent).first():
        from datetime import datetime, timezone, timedelta
        from .utils import format_event_time
        now = datetime.now(timezone.utc)
        
        seed_configs = [
            (999, now - timedelta(minutes=15), "J. Okafor", "Accepted case & engagement", "ENG-2024-0450 · Manoj Tech Solutions Pty Ltd ($6,350 pa)", "accept"),
            (1, now - timedelta(hours=1, minutes=10), "J. Okafor", "Accepted case", "C-2024-0885 · Greenbrook Unit Trust", "accept"),
            (2, now - timedelta(hours=2, minutes=20), "System", "Identity verification completed", "C-2024-0891 · Harrington, Sophie — Biometric result received from Entiq KYC", "verify"),
            (3, now - timedelta(hours=3, minutes=30), "S. Patel", "Sent invitation", "INV-2024-0112 · Nguyen, Thanh — Individual Tax", "invite"),
            (4, now - timedelta(days=1, hours=2), "A. Brennan", "Issued proposal", "C-2024-0887 · Apex Ventures Pty Ltd — $4,950 pa", "proposal"),
            (5, now - timedelta(days=1, hours=4), "A. Brennan", "Flagged pricing exception", "C-2024-0890 · Northfield Holdings — fee 18% below recommended", "exception"),
            (6, now - timedelta(days=1, hours=7), "Client", "Completed questionnaire", "C-2024-0886 · Caldwell SMSF — all sections submitted", "submit"),
            (7, datetime(2026, 7, 28, 10, 14, tzinfo=timezone.utc), "J. Okafor", "Requested additional information", "C-2024-0889 · The Marcelline Family Trust — trust deed required", "request"),
            (8, datetime(2026, 7, 28, 4, 52, tzinfo=timezone.utc), "System", "Document rejected", "C-2024-0889 · Marcelline Trust — uploaded deed illegible, replacement needed", "reject"),
            (9, datetime(2026, 7, 27, 8, 40, tzinfo=timezone.utc), "S. Patel", "Assigned case", "C-2024-0888 · Chen, David & Liu, Wei → S. Patel", "assign"),
            (10, datetime(2026, 7, 26, 4, 25, tzinfo=timezone.utc), "System", "Invitation opened", "INV-2024-0111 · Riverside Developments — link clicked, account creation started", "open"),
            (11, datetime(2026, 7, 25, 10, 30, tzinfo=timezone.utc), "A. Brennan", "Rejected case", "C-2024-0883 · Blackwood & Associates — conflict of interest identified", "reject"),
            (12, datetime(2026, 7, 24, 8, 0, tzinfo=timezone.utc), "Client", "Uploaded document", "C-2024-0886 · Caldwell SMSF — SMSF establishment deed uploaded", "upload"),
        ]
        
        events = [
            ActivityEvent(
                id=ev_id,
                time=format_event_time(ev_dt),
                actor=ev_actor,
                action=ev_action,
                target=ev_target,
                type=ev_type,
                created_at=ev_dt.replace(tzinfo=None)
            )
            for ev_id, ev_dt, ev_actor, ev_action, ev_target, ev_type in seed_configs
        ]
        db.add_all(events)

    # 8. Seed Templates
    if not db.query(Template).first():
        templates = [
            Template(id="TPL-001", name="Individual Tax Engagement", type="Engagement", service="Individual Tax", version="v4", status="Published", updated="1 Jun 2026", author="A. Brennan"),
            Template(id="TPL-002", name="Company Tax + BAS Engagement", type="Engagement", service="Company Tax", version="v3", status="Published", updated="1 Jun 2026", author="A. Brennan"),
            Template(id="TPL-003", name="Trust Tax Engagement", type="Engagement", service="Trust Tax", version="v2", status="Published", updated="15 Mar 2026", author="J. Okafor"),
            Template(id="TPL-004", name="SMSF Administration Engagement", type="Engagement", service="SMSF", version="v2", status="Published", updated="10 Feb 2026", author="J. Okafor"),
            Template(id="TPL-005", name="Individual Onboarding Questions", type="Questionnaire", service="All individual", version="v7", status="Published", updated="20 Jul 2026", author="S. Patel"),
            Template(id="TPL-006", name="Company Onboarding Questions", type="Questionnaire", service="Company", version="v5", status="Published", updated="18 Jun 2026", author="S. Patel"),
            Template(id="TPL-007", name="AML/CTF Risk Questions", type="Questionnaire", service="Designated services", version="v3", status="Draft", updated="25 Jul 2026", author="J. Okafor"),
            Template(id="TPL-008", name="Privacy Collection Notice", type="Consent notice", service="All", version="v6", status="Published", updated="1 Apr 2026", author="A. Brennan"),
            Template(id="TPL-009", name="Biometric Consent Notice", type="Consent notice", service="Identity verification", version="v2", status="Published", updated="1 Apr 2026", author="A. Brennan"),
            Template(id="TPL-010", name="Advisory Engagement", type="Engagement", service="Business Advisory", version="v1", status="Draft", updated="28 Jul 2026", author="J. Okafor"),
        ]
        db.add_all(templates)

    # 9. Seed API Key
    from .models import ApiKey, BillingSchedule, Invoice, Payment, ServiceItem, FeeItem, StaffMember, WorkflowProcess
    import json

    if not db.query(ApiKey).first():
        master_key = ApiKey(
            id="key-master-001",
            key="entiq_live_sec_7f9c2d1b8e4a3f0",
            name="Master Practice API Key",
            is_active=True
        )
        db.add(master_key)

    # 10. Seed Billing Schedules
    if not db.query(BillingSchedule).first():
        schedules = [
            BillingSchedule(id="SCH-000", client="Manoj Tech Solutions Pty Ltd", engagement_id="ENG-2024-0450", service="Company Tax Return & Advisory", type="Monthly", amount=529.17, gst=True, next_due="1 Oct 2026", adviser="J. Okafor", status="Active", square_subscription_id="sub_Mn9k4Lx"),
            BillingSchedule(id="SCH-001", client="Harrington, Sophie", engagement_id="ENG-2024-0439", service="Individual Tax Return", type="Annual", amount=1650, gst=True, next_due="1 Jun 2025", adviser="J. Okafor", status="Active", square_subscription_id="sub_Hq7k2Lm"),
            BillingSchedule(id="SCH-002", client="Harrington, Sophie", engagement_id="ENG-2024-0438", service="Business Advisory", type="Monthly", amount=1100, gst=True, next_due="1 Aug 2024", adviser="J. Okafor", status="Active", square_subscription_id="sub_Bb3f8Pn"),
            BillingSchedule(id="SCH-003", client="Greenbrook Unit Trust", engagement_id="ENG-2024-0441", service="Trust Tax Return", type="Annual", amount=4400, gst=True, next_due="1 Jul 2025", adviser="J. Okafor", status="Active", square_subscription_id="sub_Ty5m1Qr"),
            BillingSchedule(id="SCH-004", client="Greenbrook Unit Trust", engagement_id="ENG-2024-0441", service="Business Advisory", type="Monthly", amount=1100, gst=True, next_due="1 Aug 2024", adviser="J. Okafor", status="Active", square_subscription_id="sub_Vc9n4Ws"),
            BillingSchedule(id="SCH-005", client="Caldwell SMSF", engagement_id="ENG-2024-0440", service="SMSF Administration", type="Annual", amount=3300, gst=True, next_due="1 May 2025", adviser="S. Patel", status="Active", square_subscription_id="sub_Xd2p7Jt"),
            BillingSchedule(id="SCH-006", client="Caldwell SMSF", engagement_id="ENG-2024-0440", service="BAS Preparation", type="Quarterly", amount=550, gst=True, next_due="28 Oct 2024", adviser="S. Patel", status="Active", square_subscription_id="sub_Ze6q0Ku"),
            BillingSchedule(id="SCH-007", client="Apex Ventures Pty Ltd", engagement_id="ENG-2024-0430", service="Company Tax Return", type="Annual", amount=3850, gst=True, next_due="—", adviser="A. Brennan", status="Paused", square_subscription_id=""),
            BillingSchedule(id="SCH-008", client="The Marcelline Family Trust", engagement_id="ENG-2023-0391", service="Trust Tax Return", type="Job-based", amount=4400, gst=True, next_due="On completion", adviser="J. Okafor", status="Active", square_subscription_id=""),
        ]
        db.add_all(schedules)

    # 11. Seed Invoices
    if not db.query(Invoice).first():
        invoices = [
            Invoice(id="INV-2024-0313", schedule_id="SCH-000", client="Manoj Tech Solutions Pty Ltd", service="Company Tax Return & Advisory — Sept 2026", amount=529.17, gst=52.92, issued="1 Sept 2026", due="15 Sept 2026", status="Paid", xero_status="Synced", xero_invoice_no="INV-0313", square_status="Paid", square_payment_id="sqp_Mn9k4Lx"),
            Invoice(id="INV-2024-0312", schedule_id="SCH-002", client="Harrington, Sophie", service="Business Advisory — July 2024", amount=1100, gst=110, issued="1 Jul 2024", due="15 Jul 2024", status="Paid", xero_status="Synced", xero_invoice_no="INV-0312", square_status="Paid", square_payment_id="sqp_Hq7k2Lm"),
            Invoice(id="INV-2024-0311", schedule_id="SCH-004", client="Greenbrook Unit Trust", service="Business Advisory — July 2024", amount=1100, gst=110, issued="1 Jul 2024", due="15 Jul 2024", status="Paid", xero_status="Synced", xero_invoice_no="INV-0311", square_status="Paid", square_payment_id="sqp_Vc9n4Ws"),
            Invoice(id="INV-2024-0310", schedule_id="SCH-002", client="Harrington, Sophie", service="Business Advisory — June 2024", amount=1100, gst=110, issued="1 Jun 2024", due="15 Jun 2024", status="Paid", xero_status="Synced", xero_invoice_no="INV-0310", square_status="Paid", square_payment_id="sqp_Mn1a5Fb"),
            Invoice(id="INV-2024-0309", schedule_id="SCH-001", client="Harrington, Sophie", service="Individual Tax Return 2023–24", amount=1650, gst=165, issued="2 Jun 2024", due="16 Jun 2024", status="Paid", xero_status="Synced", xero_invoice_no="INV-0309", square_status="Paid", square_payment_id="sqp_Pk8b3Gc"),
            Invoice(id="INV-2024-0308", schedule_id="SCH-005", client="Caldwell SMSF", service="SMSF Administration 2023–24", amount=3300, gst=330, issued="14 Jul 2024", due="28 Jul 2024", status="Due", xero_status="Synced", xero_invoice_no="INV-0308", square_status="Pending", square_payment_id=""),
            Invoice(id="INV-2024-0307", schedule_id="SCH-006", client="Caldwell SMSF", service="BAS Preparation Q4 FY2024", amount=550, gst=55, issued="28 Jun 2024", due="12 Jul 2024", status="Overdue", xero_status="Synced", xero_invoice_no="INV-0307", square_status="Failed", square_payment_id=""),
            Invoice(id="INV-2024-0306", schedule_id="SCH-003", client="Greenbrook Unit Trust", service="Trust Tax Return 2022–23", amount=4400, gst=440, issued="18 Jul 2024", due="1 Aug 2024", status="Sent", xero_status="Synced", xero_invoice_no="INV-0306", square_status="—", square_payment_id=""),
            Invoice(id="INV-2024-0305", schedule_id="SCH-007", client="Apex Ventures Pty Ltd", service="Company Tax Return 2022–23", amount=3850, gst=385, issued="—", due="—", status="Draft", xero_status="Not synced", xero_invoice_no="", square_status="—", square_payment_id=""),
        ]
        db.add_all(invoices)

    # 12. Seed Payments
    if not db.query(Payment).first():
        payments = [
            Payment(id="PAY-000", invoice_id="INV-2024-0313", client="Manoj Tech Solutions Pty Ltd", amount=582.09, method="Visa •••• 8841", date="4 Sept 2026", square_tx_id="sqp_Mn9k4Lx", xero_reconciled=True, status="Settled"),
            Payment(id="PAY-001", invoice_id="INV-2024-0312", client="Harrington, Sophie", amount=1210, method="Visa •••• 4242", date="8 Jul 2024", square_tx_id="sqp_Hq7k2Lm", xero_reconciled=True, status="Settled"),
            Payment(id="PAY-002", invoice_id="INV-2024-0311", client="Greenbrook Unit Trust", amount=1210, method="Bank transfer", date="10 Jul 2024", square_tx_id="sqp_Vc9n4Ws", xero_reconciled=True, status="Settled"),
            Payment(id="PAY-003", invoice_id="INV-2024-0310", client="Harrington, Sophie", amount=1210, method="Visa •••• 4242", date="8 Jun 2024", square_tx_id="sqp_Mn1a5Fb", xero_reconciled=True, status="Settled"),
            Payment(id="PAY-004", invoice_id="INV-2024-0309", client="Harrington, Sophie", amount=1815, method="Visa •••• 4242", date="10 Jun 2024", square_tx_id="sqp_Pk8b3Gc", xero_reconciled=True, status="Settled"),
            Payment(id="PAY-005", invoice_id="INV-2024-0308", client="Caldwell SMSF", amount=3630, method="Mastercard •••• 7701", date="Processing", square_tx_id="", xero_reconciled=False, status="Processing"),
            Payment(id="PAY-006", invoice_id="INV-2024-0307", client="Caldwell SMSF", amount=605, method="Mastercard •••• 7701", date="12 Jul 2024", square_tx_id="", xero_reconciled=False, status="Failed"),
        ]
        db.add_all(payments)

    # 13. Seed Services
    if not db.query(ServiceItem).first():
        services = [
            ServiceItem(id="SVC-001", name="Individual Tax Return", description="Annual income tax return preparation and lodgement", entity_types=json.dumps(["Individual"]), scope="Includes one rental property, up to $20k investments", status="Active"),
            ServiceItem(id="SVC-002", name="Company Tax Return", description="Corporate income tax return and financial statements", entity_types=json.dumps(["Company"]), scope="Standard small business — excludes R&D or transfer pricing", status="Active"),
            ServiceItem(id="SVC-003", name="Trust Tax Return", description="Trust income tax return and distribution statements", entity_types=json.dumps(["Trust"]), scope="Discretionary and unit trusts", status="Active"),
            ServiceItem(id="SVC-004", name="SMSF Administration", description="Full SMSF audit, compliance and tax return", entity_types=json.dumps(["SMSF"]), scope="Up to 4 members, standard investment strategy", status="Active"),
            ServiceItem(id="SVC-005", name="BAS Preparation", description="Quarterly Business Activity Statement preparation", entity_types=json.dumps(["Company", "Partnership", "Trust"]), scope="GST, PAYG withholding, fuel tax credits", status="Active"),
            ServiceItem(id="SVC-006", name="Business Advisory", description="Strategic financial advice and management reporting", entity_types=json.dumps(["Company", "Partnership"]), scope="Monthly meetings, management accounts, KPI dashboard", status="Active"),
            ServiceItem(id="SVC-007", name="Partnership Tax Return", description="Partnership tax return and distribution schedule", entity_types=json.dumps(["Partnership"]), scope="Standard partnership — excludes foreign partners", status="Active"),
        ]
        db.add_all(services)

    # 14. Seed Fees
    if not db.query(FeeItem).first():
        fees = [
            FeeItem(id="FEE-001", service="Individual Tax Return", basis="Fixed", amount=1650, frequency="Annual", gst=True, notes="Base rate — complex returns quoted separately"),
            FeeItem(id="FEE-002", service="Company Tax Return", basis="Fixed", amount=3850, frequency="Annual", gst=True, notes="Turnover < $5M. Additional $550 per entity in group."),
            FeeItem(id="FEE-003", service="Trust Tax Return", basis="Fixed", amount=4400, frequency="Annual", gst=True, notes="Discretionary trust base rate"),
            FeeItem(id="FEE-004", service="SMSF Administration", basis="Fixed", amount=3300, frequency="Annual", gst=True, notes="Full admin + audit. Audit conducted by external auditor."),
            FeeItem(id="FEE-005", service="BAS Preparation", basis="Fixed", amount=550, frequency="Quarterly", gst=True, notes="Per quarter — IAS lodgement included"),
            FeeItem(id="FEE-006", service="Business Advisory", basis="Fixed", amount=1100, frequency="Monthly", gst=True, notes="Retainer. Additional project work at charge-out rate."),
            FeeItem(id="FEE-007", service="Partnership Tax Return", basis="Fixed", amount=2750, frequency="Annual", gst=True, notes=""),
        ]
        db.add_all(fees)

    # 15. Seed Staff
    if not db.query(StaffMember).first():
        staff_members = [
            StaffMember(id="STF-001", name="James Okafor", role="Partner", rate=520, currency="AUD", unit="hour", email="j.okafor@growadvisory.com.au", status="Active"),
            StaffMember(id="STF-002", name="Amelia Brennan", role="Senior Manager", rate=380, currency="AUD", unit="hour", email="a.brennan@growadvisory.com.au", status="Active"),
            StaffMember(id="STF-003", name="Sanjay Patel", role="Senior Accountant", rate=280, currency="AUD", unit="hour", email="s.patel@growadvisory.com.au", status="Active"),
            StaffMember(id="STF-004", name="Chloe Richardson", role="Accountant", rate=195, currency="AUD", unit="hour", email="c.richardson@growadvisory.com.au", status="Active"),
            StaffMember(id="STF-005", name="Marcus Webb", role="Graduate Accountant", rate=130, currency="AUD", unit="hour", email="m.webb@growadvisory.com.au", status="Active"),
            StaffMember(id="STF-006", name="Linda Tran", role="Practice Manager", rate=165, currency="AUD", unit="hour", email="l.tran@growadvisory.com.au", status="Active"),
        ]
        db.add_all(staff_members)

    # 16. Seed Workflow Process
    if not db.query(WorkflowProcess).first():
        default_wf = WorkflowProcess(
            id="WF-001",
            name="Standard Engagement Signing & Onboarding Flow",
            description="Practice standard flow: Identity verification, proposal acceptance, Square payment authority, and e-signature.",
            nodes_json="[]",
            edges_json="[]",
            status="Active"
        )
        db.add(default_wf)

    db.commit()
