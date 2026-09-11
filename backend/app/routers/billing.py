from typing import Optional, List
from datetime import datetime
import random
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import BillingSchedule, Invoice, Payment, ActivityEvent
from ..schemas import (
    BillingScheduleSchema,
    BillingScheduleCreate,
    BillingScheduleUpdate,
    InvoiceSchema,
    InvoiceCreate,
    InvoiceUpdate,
    PaymentSchema,
    PaymentCreate,
    PaymentUpdate,
    BillingStatsSchema,
    PaginatedResponse,
)

router = APIRouter(prefix="/billing", tags=["Billing & Payments"])

# ─── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=BillingStatsSchema)
def get_billing_stats(db: Session = Depends(get_db)):
    schedules = db.query(BillingSchedule).all()
    invoices = db.query(Invoice).all()
    payments = db.query(Payment).all()

    active_schedules = len([s for s in schedules if s.status == "Active"])
    overdue_count = len([i for i in invoices if i.status == "Overdue"])
    settled_payments = [p for p in payments if p.status == "Settled"]

    total_revenue_ytd = sum(p.amount for p in settled_payments)
    # Collected this month (approx or recent)
    collected_this_month = sum(p.amount for p in settled_payments[:4]) if settled_payments else 0.0
    outstanding = sum(i.amount + i.gst for i in invoices if i.status in ["Due", "Overdue", "Sent"])

    return BillingStatsSchema(
        total_revenue_ytd=round(total_revenue_ytd, 2),
        collected_this_month=round(collected_this_month, 2),
        outstanding_invoices=round(outstanding, 2),
        active_schedules=active_schedules,
        overdue_count=overdue_count,
        settled_payments_count=len(settled_payments),
    )

# ─── Billing Schedules ────────────────────────────────────────────────────────

@router.get("/schedules", response_model=PaginatedResponse[BillingScheduleSchema])
def list_schedules(
    client: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db),
):
    query = db.query(BillingSchedule)
    if client:
        query = query.filter(BillingSchedule.client.ilike(f"%{client}%"))
    if status and status != "All":
        query = query.filter(BillingSchedule.status == status)

    total = query.count()
    items = query.order_by(BillingSchedule.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse[BillingScheduleSchema](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )

@router.post("/schedules", response_model=BillingScheduleSchema, status_code=status.HTTP_201_CREATED)
def create_schedule(payload: BillingScheduleCreate, db: Session = Depends(get_db)):
    sch_id = payload.id or f"SCH-{random.randint(100, 999)}"
    new_sch = BillingSchedule(
        id=sch_id,
        client=payload.client,
        engagement_id=payload.engagement_id or "",
        service=payload.service,
        type=payload.type,
        amount=payload.amount,
        gst=payload.gst,
        next_due=payload.next_due or "1st Next Month",
        adviser=payload.adviser or "J. Okafor",
        status=payload.status or "Active",
        square_subscription_id=payload.square_subscription_id or f"sub_{random.randint(10000, 99999)}",
        created_at=datetime.utcnow(),
    )
    db.add(new_sch)
    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Created billing schedule",
        target=f"{new_sch.id} · {new_sch.client} (${new_sch.amount:,.2f})",
        type="accept",
    ))
    db.commit()
    db.refresh(new_sch)
    return new_sch

@router.put("/schedules/{schedule_id}", response_model=BillingScheduleSchema)
def update_schedule(schedule_id: str, payload: BillingScheduleUpdate, db: Session = Depends(get_db)):
    sch = db.query(BillingSchedule).filter(BillingSchedule.id == schedule_id).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Billing schedule not found")

    if payload.service is not None:
        sch.service = payload.service
    if payload.type is not None:
        sch.type = payload.type
    if payload.status is not None:
        sch.status = payload.status
    if payload.amount is not None:
        sch.amount = payload.amount
    if payload.next_due is not None:
        sch.next_due = payload.next_due
    if payload.adviser is not None:
        sch.adviser = payload.adviser
    if payload.square_subscription_id is not None:
        sch.square_subscription_id = payload.square_subscription_id

    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action=f"Updated billing schedule ({sch.status})",
        target=f"{sch.id} · {sch.client}",
        type="accept",
    ))
    db.commit()
    db.refresh(sch)
    return sch

@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(schedule_id: str, db: Session = Depends(get_db)):
    sch = db.query(BillingSchedule).filter(BillingSchedule.id == schedule_id).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Billing schedule not found")

    client_name = sch.client
    db.delete(sch)
    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Deleted billing schedule",
        target=f"{schedule_id} · {client_name}",
        type="reject",
    ))
    db.commit()
    return None

# ─── Invoices ─────────────────────────────────────────────────────────────────

@router.get("/invoices", response_model=PaginatedResponse[InvoiceSchema])
def list_invoices(
    client: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db),
):
    query = db.query(Invoice)
    if client:
        query = query.filter(Invoice.client.ilike(f"%{client}%"))
    if status and status != "All":
        query = query.filter(Invoice.status == status)

    total = query.count()
    items = query.order_by(Invoice.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse[InvoiceSchema](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )

@router.post("/invoices", response_model=InvoiceSchema, status_code=status.HTTP_201_CREATED)
def create_invoice(payload: InvoiceCreate, db: Session = Depends(get_db)):
    inv_id = payload.id or f"INV-2024-{random.randint(400, 999)}"
    new_inv = Invoice(
        id=inv_id,
        schedule_id=payload.schedule_id or "",
        client=payload.client,
        service=payload.service,
        amount=payload.amount,
        gst=payload.gst or round(payload.amount * 0.1, 2),
        issued=payload.issued or datetime.utcnow().strftime("%d %b %Y"),
        due=payload.due or datetime.utcnow().strftime("%d %b %Y"),
        status=payload.status or "Draft",
        xero_status=payload.xero_status or "Synced",
        xero_invoice_no=payload.xero_invoice_no or f"INV-{random.randint(1000, 9999)}",
        square_status=payload.square_status or "—",
        square_payment_id=payload.square_payment_id or "",
        created_at=datetime.utcnow(),
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)
    return new_inv

@router.patch("/invoices/{invoice_id}/status", response_model=InvoiceSchema)
def update_invoice_status(invoice_id: str, new_status: str = Query(...), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    inv.status = new_status
    if new_status == "Paid":
        inv.square_status = "Paid"
    db.commit()
    db.refresh(inv)
    return inv

@router.put("/invoices/{invoice_id}", response_model=InvoiceSchema)
def update_invoice(invoice_id: str, payload: InvoiceUpdate, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if payload.client is not None:
        inv.client = payload.client
    if payload.service is not None:
        inv.service = payload.service
    if payload.amount is not None:
        inv.amount = payload.amount
        inv.gst = payload.gst if payload.gst is not None else round(payload.amount * 0.1, 2)
    elif payload.gst is not None:
        inv.gst = payload.gst
    if payload.issued is not None:
        inv.issued = payload.issued
    if payload.due is not None:
        inv.due = payload.due
    if payload.status is not None:
        inv.status = payload.status
        if payload.status == "Paid":
            inv.square_status = "Paid"
    if payload.xero_status is not None:
        inv.xero_status = payload.xero_status
    if payload.square_status is not None:
        inv.square_status = payload.square_status

    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Updated invoice",
        target=f"{inv.id} · {inv.client}",
        type="accept",
    ))
    db.commit()
    db.refresh(inv)
    return inv

@router.delete("/invoices/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(invoice_id: str, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    client_name = inv.client
    db.delete(inv)
    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Deleted invoice",
        target=f"{invoice_id} · {client_name}",
        type="reject",
    ))
    db.commit()
    return None

# ─── Payments ─────────────────────────────────────────────────────────────────

@router.get("/payments", response_model=PaginatedResponse[PaymentSchema])
def list_payments(
    client: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db),
):
    query = db.query(Payment)
    if client:
        query = query.filter(Payment.client.ilike(f"%{client}%"))
    if status and status != "All":
        query = query.filter(Payment.status == status)

    total = query.count()
    items = query.order_by(Payment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse[PaymentSchema](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )

@router.post("/payments", response_model=PaymentSchema, status_code=status.HTTP_201_CREATED)
def record_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    pay_id = payload.id or f"PAY-{random.randint(100, 999)}"
    new_pay = Payment(
        id=pay_id,
        invoice_id=payload.invoice_id or "",
        client=payload.client,
        amount=payload.amount,
        method=payload.method or "Credit Card",
        date=payload.date or datetime.utcnow().strftime("%d %b %Y"),
        square_tx_id=payload.square_tx_id or f"sqp_{random.randint(10000, 99999)}",
        xero_reconciled=payload.xero_reconciled if payload.xero_reconciled is not None else True,
        status=payload.status or "Settled",
        created_at=datetime.utcnow(),
    )
    db.add(new_pay)

    # If linked to invoice, mark invoice as Paid
    if payload.invoice_id:
        inv = db.query(Invoice).filter(Invoice.id == payload.invoice_id).first()
        if inv:
            inv.status = "Paid"
            inv.square_status = "Paid"
            inv.square_payment_id = new_pay.square_tx_id

    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Recorded payment via Square",
        target=f"{new_pay.id} · {new_pay.client} (${new_pay.amount:,.2f})",
        type="accept",
    ))
    db.commit()
    db.refresh(new_pay)
    return new_pay

@router.put("/payments/{payment_id}", response_model=PaymentSchema)
def update_payment(payment_id: str, payload: PaymentUpdate, db: Session = Depends(get_db)):
    pay = db.query(Payment).filter(Payment.id == payment_id).first()
    if not pay:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payload.method is not None:
        pay.method = payload.method
    if payload.amount is not None:
        pay.amount = payload.amount
    if payload.date is not None:
        pay.date = payload.date
    if payload.status is not None:
        pay.status = payload.status
    if payload.xero_reconciled is not None:
        pay.xero_reconciled = payload.xero_reconciled

    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Updated payment record",
        target=f"{pay.id} · {pay.client}",
        type="accept",
    ))
    db.commit()
    db.refresh(pay)
    return pay

@router.delete("/payments/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(payment_id: str, db: Session = Depends(get_db)):
    pay = db.query(Payment).filter(Payment.id == payment_id).first()
    if not pay:
        raise HTTPException(status_code=404, detail="Payment not found")

    client_name = pay.client
    db.delete(pay)
    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Deleted payment record",
        target=f"{payment_id} · {client_name}",
        type="reject",
    ))
    db.commit()
    return None
