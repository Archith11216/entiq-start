from typing import List, Optional, Generic, TypeVar, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

T = TypeVar("T")

# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class LoginRequest(CamelModel):
    email: str
    password: str

class RefreshTokenRequest(CamelModel):
    refresh_token: str

class AuthTokens(CamelModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int = 86400

class UserProfile(CamelModel):
    id: str
    email: str
    first_name: str
    last_name: str
    display_name: str
    initials: str
    role: str
    firm_name: str
    avatar_url: Optional[str] = None

# ─── Case Schemas ─────────────────────────────────────────────────────────────

class OnboardingCaseSchema(CamelModel):
    id: str
    client: str
    entity: str
    service: str
    status: str
    risk: str
    owner: str
    created: str
    due: str
    channel: str
    progress: int

class CaseStatusUpdate(CamelModel):
    status: str

class CaseUpdate(CamelModel):
    client: Optional[str] = None
    entity: Optional[str] = None
    service: Optional[str] = None
    status: Optional[str] = None
    risk: Optional[str] = None
    owner: Optional[str] = None
    due: Optional[str] = None
    channel: Optional[str] = None
    progress: Optional[int] = None

class CaseInfoRequestPayload(CamelModel):
    recipient_email: str
    message: str
    subject: Optional[str] = None

class CaseInfoRequestResponse(CamelModel):
    delivered: bool
    message: str
    recipient_email: str
    status: str
    simulated: Optional[bool] = False

# ─── Alert Schemas ────────────────────────────────────────────────────────────

class ReviewAlertSchema(CamelModel):
    id: str
    type: str
    severity: str
    case: str
    message: str
    age: str

# ─── Dashboard Schemas ────────────────────────────────────────────────────────

class StageCount(CamelModel):
    stage: str
    count: int

class WeekTrend(CamelModel):
    week: str
    time: int

class DashboardStatsSchema(CamelModel):
    active: int
    overdue: int
    accepted: int
    exceptions: int
    conversion_data: List[StageCount]
    completion_trend: List[WeekTrend]

# ─── Invitation Schemas ───────────────────────────────────────────────────────

class InvitationSchema(CamelModel):
    id: str
    client: str
    email: str
    service: str
    channel: str
    status: str
    sent: str
    expires: str
    owner: str
    email_delivered: Optional[bool] = None
    email_message: Optional[str] = None
    portal_link: Optional[str] = None

class InvitationStatsSchema(CamelModel):
    sent_this_month: int
    opened: int
    started: int
    expiring_in_3_days: int

class AdditionalCompanySchema(CamelModel):
    name: str
    abn: Optional[str] = ""
    acn: Optional[str] = ""
    role: Optional[str] = "Corporate Trustee"

class CreateInvitationPayload(CamelModel):
    client_name: str
    email: str
    phone: Optional[str] = None
    client_type: str = "Individual"
    service: str = "Individual Tax"
    channel: str = "Email"
    due_date: Optional[str] = None
    assign_to: str = "J. Okafor"
    additional_companies: Optional[List[AdditionalCompanySchema]] = None

class ResendPayload(CamelModel):
    to_email: Optional[str] = None

class InvitationUpdate(CamelModel):
    client: Optional[str] = None
    email: Optional[str] = None
    service: Optional[str] = None
    channel: Optional[str] = None
    status: Optional[str] = None
    expires: Optional[str] = None
    owner: Optional[str] = None

class EmailConfigSchema(CamelModel):
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password_set: bool = False
    smtp_from_email: str = ""
    smtp_from_name: str = "Grow Advisory Group"
    frontend_url: str = "http://localhost:5173"
    is_configured: bool = False

class EmailConfigUpdate(CamelModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_from_name: Optional[str] = None
    frontend_url: Optional[str] = None

class TestEmailPayload(CamelModel):
    to_email: str
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_from_name: Optional[str] = None

class EmailSendResult(CamelModel):
    status: str
    delivered: bool
    message: Optional[str] = None
    simulated: Optional[bool] = False
    link: Optional[str] = None

# ─── Client Schemas ───────────────────────────────────────────────────────────

class ClientEntitySchema(CamelModel):
    id: Optional[str] = None
    name: str
    type: str
    abn: str = ""
    acn: str = ""
    status: str = "Active"
    verified: str = "Document"
    cases: int = 1
    engagements: int = 1
    added: str = "Today"

class ClientEntityCreate(CamelModel):
    name: str
    type: str
    abn: Optional[str] = ""
    acn: Optional[str] = ""
    verified: Optional[str] = "Document"
    cases: Optional[int] = 1
    engagements: Optional[int] = 1

# ─── Engagement Schemas ───────────────────────────────────────────────────────

class EngagementSchema(CamelModel):
    id: str
    client: str
    service: str
    signed: str
    renewal_due: str
    fee: str
    status: str
    adviser: str

class EngagementCreate(CamelModel):
    id: Optional[str] = None
    client: str
    service: str
    signed: Optional[str] = ""
    renewal_due: Optional[str] = ""
    fee: str
    status: Optional[str] = "Active"
    adviser: Optional[str] = "J. Okafor"

class EngagementStatusUpdate(CamelModel):
    status: str

class EngagementUpdate(CamelModel):
    client: Optional[str] = None
    service: Optional[str] = None
    fee: Optional[str] = None
    status: Optional[str] = None
    renewal_due: Optional[str] = None
    adviser: Optional[str] = None

# ─── Activity Schemas ─────────────────────────────────────────────────────────

class ActivityEventSchema(CamelModel):
    id: int
    time: str
    actor: str
    action: str
    target: str
    type: str
    created_at: Optional[datetime] = None

class ActivityEventCreate(CamelModel):
    time: Optional[str] = None
    actor: Optional[str] = "System"
    action: str
    target: str
    type: str = "info"

# ─── Template Schemas ─────────────────────────────────────────────────────────

class TemplateSchema(CamelModel):
    id: str
    name: str
    type: str
    service: str
    version: str
    status: str
    updated: str
    author: str

# ─── Generic Paginated Response ───────────────────────────────────────────────

class PaginatedResponse(CamelModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    has_more: bool

# ─── API Key Schemas ──────────────────────────────────────────────────────────

class ApiKeySchema(CamelModel):
    id: str
    key: str
    name: str
    is_active: bool
    created_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None

class ApiKeyCreate(CamelModel):
    name: str
    key: Optional[str] = None

# ─── Billing Schemas ──────────────────────────────────────────────────────────

class BillingScheduleSchema(CamelModel):
    id: str
    client: str
    engagement_id: Optional[str] = ""
    service: str
    type: str
    amount: float
    gst: bool = True
    next_due: str = ""
    adviser: str = "J. Okafor"
    status: str = "Active"
    square_subscription_id: Optional[str] = ""

class BillingScheduleCreate(CamelModel):
    id: Optional[str] = None
    client: str
    engagement_id: Optional[str] = ""
    service: str
    type: str = "Monthly"
    amount: float
    gst: bool = True
    next_due: Optional[str] = ""
    adviser: Optional[str] = "J. Okafor"
    status: Optional[str] = "Active"
    square_subscription_id: Optional[str] = ""

class BillingScheduleUpdate(CamelModel):
    service: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    amount: Optional[float] = None
    next_due: Optional[str] = None
    adviser: Optional[str] = None
    square_subscription_id: Optional[str] = None

class InvoiceSchema(CamelModel):
    id: str
    schedule_id: Optional[str] = ""
    client: str
    service: str
    amount: float
    gst: float = 0.0
    issued: str = ""
    due: str = ""
    status: str = "Draft"
    xero_status: str = "Not synced"
    xero_invoice_no: Optional[str] = ""
    square_status: str = "—"
    square_payment_id: Optional[str] = ""

class InvoiceCreate(CamelModel):
    id: Optional[str] = None
    schedule_id: Optional[str] = ""
    client: str
    service: str
    amount: float
    gst: Optional[float] = 0.0
    issued: Optional[str] = ""
    due: Optional[str] = ""
    status: Optional[str] = "Draft"
    xero_status: Optional[str] = "Not synced"
    xero_invoice_no: Optional[str] = ""
    square_status: Optional[str] = "—"
    square_payment_id: Optional[str] = ""

class InvoiceUpdate(CamelModel):
    client: Optional[str] = None
    service: Optional[str] = None
    amount: Optional[float] = None
    gst: Optional[float] = None
    issued: Optional[str] = None
    due: Optional[str] = None
    status: Optional[str] = None
    xero_status: Optional[str] = None
    square_status: Optional[str] = None

class PaymentSchema(CamelModel):
    id: str
    invoice_id: Optional[str] = ""
    client: str
    amount: float
    method: str = "Credit Card"
    date: str = "Today"
    square_tx_id: Optional[str] = ""
    xero_reconciled: bool = False
    status: str = "Settled"

class PaymentCreate(CamelModel):
    id: Optional[str] = None
    invoice_id: Optional[str] = ""
    client: str
    amount: float
    method: Optional[str] = "Credit Card"
    date: Optional[str] = "Today"
    square_tx_id: Optional[str] = ""
    xero_reconciled: Optional[bool] = False
    status: Optional[str] = "Settled"

class PaymentUpdate(CamelModel):
    method: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    status: Optional[str] = None
    xero_reconciled: Optional[bool] = None

class BillingStatsSchema(CamelModel):
    total_revenue_ytd: float
    collected_this_month: float
    outstanding_invoices: float
    active_schedules: int
    overdue_count: int
    settled_payments_count: int

# ─── Service & Pricing Schemas ────────────────────────────────────────────────

class ServiceItemSchema(CamelModel):
    id: str
    name: str
    description: str = ""
    entity_types: List[str] = []
    scope: str = ""
    status: str = "Active"

class ServiceItemCreate(CamelModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    entity_types: Optional[List[str]] = []
    scope: Optional[str] = ""
    status: Optional[str] = "Active"

class FeeItemSchema(CamelModel):
    id: str
    service: str
    basis: str = "Fixed"
    amount: float
    frequency: str = "Annual"
    gst: bool = True
    notes: str = ""

class FeeItemCreate(CamelModel):
    id: Optional[str] = None
    service: str
    basis: Optional[str] = "Fixed"
    amount: float
    frequency: Optional[str] = "Annual"
    gst: Optional[bool] = True
    notes: Optional[str] = ""

class StaffMemberSchema(CamelModel):
    id: str
    name: str
    role: str = "Accountant"
    rate: float
    currency: str = "AUD"
    unit: str = "hour"
    email: str = ""
    status: str = "Active"

class StaffMemberCreate(CamelModel):
    id: Optional[str] = None
    name: str
    role: Optional[str] = "Accountant"
    rate: float
    currency: Optional[str] = "AUD"
    unit: Optional[str] = "hour"
    email: Optional[str] = ""
    status: Optional[str] = "Active"

# ─── Workflow Process Schemas ─────────────────────────────────────────────────

class WorkflowProcessSchema(CamelModel):
    id: str
    name: str
    description: str = ""
    nodes_json: str = "[]"
    edges_json: str = "[]"
    status: str = "Active"
    updated_at: Optional[datetime] = None

class WorkflowProcessCreate(CamelModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    nodes_json: str = "[]"
    edges_json: str = "[]"
    status: Optional[str] = "Active"
