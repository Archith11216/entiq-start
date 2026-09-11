from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Float
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), default="")
    last_name = Column(String(100), default="")
    display_name = Column(String(100), default="")
    initials = Column(String(10), default="")
    role = Column(String(50), default="Partner")
    firm_name = Column(String(150), default="Grow Advisory Group")
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class OnboardingCase(Base):
    __tablename__ = "onboarding_cases"

    id = Column(String(50), primary_key=True, index=True)
    client = Column(String(255), nullable=False, index=True)
    entity = Column(String(100), nullable=False)
    service = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="Draft", index=True)
    risk = Column(String(20), nullable=False, default="Low")
    owner = Column(String(100), nullable=False, default="J. Okafor")
    created = Column(String(50), default="Today")
    due = Column(String(50), default="")
    channel = Column(String(50), default="Invitation")
    progress = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class ReviewAlert(Base):
    __tablename__ = "review_alerts"

    id = Column(String(50), primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # identity, document, commercial, conflict, compliance
    severity = Column(String(20), nullable=False, default="warning")  # warning, error, info
    case = Column(String(50), nullable=False)  # case ID reference
    message = Column(Text, nullable=False)
    age = Column(String(20), default="1d")
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(String(50), primary_key=True, index=True)
    client = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False)
    service = Column(String(255), nullable=False)
    channel = Column(String(50), default="Email")
    status = Column(String(50), default="Sent", index=True)
    sent = Column(String(50), default="Today")
    expires = Column(String(50), default="")
    owner = Column(String(100), default="J. Okafor")
    created_at = Column(DateTime, default=datetime.utcnow)

class ClientEntity(Base):
    __tablename__ = "client_entities"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # Company, Individual, Trust, SMSF, Partnership
    abn = Column(String(50), default="")
    acn = Column(String(50), default="")
    status = Column(String(50), default="Active")
    verified = Column(String(50), default="Document")
    cases = Column(Integer, default=1)
    engagements = Column(Integer, default=1)
    added = Column(String(50), default="Today")
    created_at = Column(DateTime, default=datetime.utcnow)

class Engagement(Base):
    __tablename__ = "engagements"

    id = Column(String(50), primary_key=True, index=True)
    client = Column(String(255), nullable=False, index=True)
    service = Column(String(255), nullable=False)
    signed = Column(String(50), default="")
    renewal_due = Column(String(50), default="")
    fee = Column(String(50), default="")
    status = Column(String(50), default="Active", index=True)
    adviser = Column(String(100), default="J. Okafor")
    created_at = Column(DateTime, default=datetime.utcnow)

class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    time = Column(String(50), nullable=False, default="Just now")
    actor = Column(String(100), nullable=False, default="System")
    action = Column(String(255), nullable=False)
    target = Column(Text, nullable=False)
    type = Column(String(50), nullable=False, default="info")
    created_at = Column(DateTime, default=datetime.utcnow)

class Template(Base):
    __tablename__ = "templates"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    type = Column(String(100), nullable=False)  # Engagement, Questionnaire, Consent notice
    service = Column(String(255), nullable=False)
    version = Column(String(20), default="v1")
    status = Column(String(50), default="Published")
    updated = Column(String(50), default="")
    author = Column(String(100), default="J. Okafor")
    created_at = Column(DateTime, default=datetime.utcnow)

class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(50), primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)

class BillingSchedule(Base):
    __tablename__ = "billing_schedules"

    id = Column(String(50), primary_key=True, index=True)
    client = Column(String(255), nullable=False, index=True)
    engagement_id = Column(String(50), default="")
    service = Column(String(255), nullable=False)
    type = Column(String(50), default="Monthly")  # Monthly, Quarterly, Annual, etc.
    amount = Column(Float, default=0.0)
    gst = Column(Boolean, default=True)
    next_due = Column(String(50), default="")
    adviser = Column(String(100), default="J. Okafor")
    status = Column(String(50), default="Active")  # Active, Paused, Completed
    square_subscription_id = Column(String(100), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(50), primary_key=True, index=True)
    schedule_id = Column(String(50), default="")
    client = Column(String(255), nullable=False, index=True)
    service = Column(String(255), nullable=False)
    amount = Column(Float, default=0.0)
    gst = Column(Float, default=0.0)
    issued = Column(String(50), default="")
    due = Column(String(50), default="")
    status = Column(String(50), default="Draft")  # Draft, Sent, Due, Overdue, Paid, Voided
    xero_status = Column(String(50), default="Not synced")  # Synced, Pending, Error, Not synced
    xero_invoice_no = Column(String(50), default="")
    square_status = Column(String(50), default="—")  # Paid, Pending, Failed, Refunded, —
    square_payment_id = Column(String(100), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(50), primary_key=True, index=True)
    invoice_id = Column(String(50), default="")
    client = Column(String(255), nullable=False, index=True)
    amount = Column(Float, default=0.0)
    method = Column(String(100), default="Credit Card")
    date = Column(String(50), default="Today")
    square_tx_id = Column(String(100), default="")
    xero_reconciled = Column(Boolean, default=False)
    status = Column(String(50), default="Settled")  # Settled, Processing, Failed, Refunded
    created_at = Column(DateTime, default=datetime.utcnow)

class ServiceItem(Base):
    __tablename__ = "services"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, default="")
    entity_types = Column(Text, default="[]")  # JSON encoded list of entity types
    scope = Column(Text, default="")
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

class FeeItem(Base):
    __tablename__ = "fees"

    id = Column(String(50), primary_key=True, index=True)
    service = Column(String(255), nullable=False, index=True)
    basis = Column(String(50), default="Fixed")  # Fixed, Hourly, Range
    amount = Column(Float, default=0.0)
    frequency = Column(String(50), default="Annual")  # Annual, Monthly, Quarterly, etc.
    gst = Column(Boolean, default=True)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

class StaffMember(Base):
    __tablename__ = "staff"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    role = Column(String(100), default="Accountant")
    rate = Column(Float, default=0.0)
    currency = Column(String(10), default="AUD")
    unit = Column(String(20), default="hour")
    email = Column(String(255), default="")
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

class WorkflowProcess(Base):
    __tablename__ = "workflows"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    nodes_json = Column(Text, default="[]")
    edges_json = Column(Text, default="[]")
    status = Column(String(50), default="Active")
    updated_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

