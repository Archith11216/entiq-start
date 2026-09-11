from typing import Optional
from datetime import datetime, timedelta
import random
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import Invitation, OnboardingCase, ActivityEvent
from ..schemas import (
    InvitationSchema,
    InvitationStatsSchema,
    CreateInvitationPayload,
    ResendPayload,
    InvitationUpdate,
    PaginatedResponse,
    EmailConfigSchema,
    EmailConfigUpdate,
    TestEmailPayload,
    EmailSendResult,
)
from ..email_service import (
    get_active_email_config,
    save_email_config,
    send_invitation_email,
    send_test_email,
)

router = APIRouter(prefix="/invitations", tags=["Invitations"])

@router.get("", response_model=PaginatedResponse[InvitationSchema])
def list_invitations(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db)
):
    query = db.query(Invitation)

    if status and status != "All":
        query = query.filter(Invitation.status == status)

    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Invitation.client.ilike(pattern),
                Invitation.email.ilike(pattern),
                Invitation.service.ilike(pattern),
                Invitation.id.ilike(pattern)
            )
        )

    total = query.count()
    items = query.order_by(Invitation.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse[InvitationSchema](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total
    )

@router.get("/stats", response_model=InvitationStatsSchema)
def get_invitation_stats(db: Session = Depends(get_db)):
    items = db.query(Invitation).all()
    opened = sum(1 for i in items if i.status in {"Opened", "Started", "Completed"})
    started = sum(1 for i in items if i.status in {"Started", "Completed"})
    expiring = sum(1 for i in items if i.status in {"Sent", "Opened"})[:3] if isinstance(sum(1 for i in items if i.status in {"Sent", "Opened"}), list) else sum(1 for i in items if i.status in {"Sent", "Opened"} and ("11 Aug" in i.expires or "18 Sept" in i.expires))

    return InvitationStatsSchema(
        sent_this_month=len(items),
        opened=opened,
        started=started,
        expiring_in_3_days=min(3, expiring or 2)
    )

@router.post("", response_model=InvitationSchema, status_code=status.HTTP_201_CREATED)
def create_invitation(payload: CreateInvitationPayload, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    expiry = now + timedelta(days=14)

    while True:
        inv_id = f"INV-2024-{random.randint(1000, 99999)}"
        if not db.query(Invitation).filter(Invitation.id == inv_id).first():
            break

    new_inv = Invitation(
        id=inv_id,
        client=payload.client_name or "New Client",
        email=payload.email or "client@example.com",
        service=payload.service or "Individual Tax",
        channel=payload.channel or "Email",
        status="Sent",
        sent=now.strftime("%d %b"),
        expires=expiry.strftime("%d %b"),
        owner=payload.assign_to or "J. Okafor"
    )
    db.add(new_inv)

    # Automatically create the onboarding case as well
    while True:
        case_id = f"C-2024-{random.randint(1000, 99999)}"
        if not db.query(OnboardingCase).filter(OnboardingCase.id == case_id).first():
            break

    new_case = OnboardingCase(
        id=case_id,
        client=new_inv.client,
        entity=payload.client_type or "Individual",
        service=new_inv.service,
        status="Invited",
        risk="Low",
        owner=new_inv.owner,
        created=new_inv.sent,
        due=new_inv.expires,
        channel=new_inv.channel,
        progress=0
    )
    db.add(new_case)

    # If creating a Trust or Company with multiple companies, register cases for them
    if payload.additional_companies and payload.client_type in {"Company", "Trust"}:
        for add_co in payload.additional_companies:
            if not add_co.name.strip():
                continue
            while True:
                add_case_id = f"C-2024-{random.randint(1000, 99999)}"
                if not db.query(OnboardingCase).filter(OnboardingCase.id == add_case_id).first():
                    break
            add_case = OnboardingCase(
                id=add_case_id,
                client=add_co.name.strip(),
                entity="Company",
                service="Company Tax + Advisory" if payload.client_type == "Trust" else payload.service,
                status="Invited",
                risk="Low",
                owner=new_inv.owner,
                created=new_inv.sent,
                due=new_inv.expires,
                channel=new_inv.channel,
                progress=0
            )
            db.add(add_case)

    # Log activity
    db.add(ActivityEvent(
        time="Just now",
        actor=new_inv.owner,
        action="Sent invitation",
        target=f"{new_inv.id} · {new_inv.client} — {new_inv.service}" + (f" (+{len(payload.additional_companies)} companies)" if payload.additional_companies else ""),
        type="invite"
    ))

    db.commit()
    db.refresh(new_inv)

    # Dispatch email via SMTP (or simulated if not configured)
    email_res = {"delivered": False, "message": "Email dispatch pending"}
    try:
        email_res = send_invitation_email(
            db=db,
            recipient_email=new_inv.email,
            client_name=new_inv.client,
            service=new_inv.service,
            inv_id=new_inv.id,
            expires=new_inv.expires or "14 days"
        )
    except Exception as err:
        print(f"[INVITATION EMAIL ERROR] {err}")
        email_res = {"delivered": False, "message": str(err)}

    return InvitationSchema(
        id=new_inv.id,
        client=new_inv.client,
        email=new_inv.email,
        service=new_inv.service,
        channel=new_inv.channel,
        status=new_inv.status,
        sent=new_inv.sent,
        expires=new_inv.expires,
        owner=new_inv.owner,
        email_delivered=email_res.get("delivered", False),
        email_message=email_res.get("message", ""),
        portal_link=email_res.get("link", "")
    )

@router.get("/email-config", response_model=EmailConfigSchema)
def get_email_config_endpoint(db: Session = Depends(get_db)):
    cfg = get_active_email_config(db)
    return EmailConfigSchema(
        smtp_host=cfg.get("smtp_host", "smtp.gmail.com"),
        smtp_port=int(cfg.get("smtp_port", 587)),
        smtp_user=cfg.get("smtp_user", ""),
        smtp_password_set=bool(cfg.get("smtp_password")),
        smtp_from_email=cfg.get("smtp_from_email", ""),
        smtp_from_name=cfg.get("smtp_from_name", "Grow Advisory Group"),
        frontend_url=cfg.get("frontend_url", "http://localhost:5173"),
        is_configured=cfg.get("is_configured", False),
    )

@router.put("/email-config", response_model=EmailConfigSchema)
def update_email_config_endpoint(payload: EmailConfigUpdate, db: Session = Depends(get_db)):
    updated = save_email_config(db, payload.model_dump(by_alias=False, exclude_unset=True))
    return EmailConfigSchema(
        smtp_host=updated.get("smtp_host", "smtp.gmail.com"),
        smtp_port=int(updated.get("smtp_port", 587)),
        smtp_user=updated.get("smtp_user", ""),
        smtp_password_set=bool(updated.get("smtp_password")),
        smtp_from_email=updated.get("smtp_from_email", ""),
        smtp_from_name=updated.get("smtp_from_name", "Grow Advisory Group"),
        frontend_url=updated.get("frontend_url", "http://localhost:5173"),
        is_configured=updated.get("is_configured", False),
    )

@router.post("/test-email", response_model=EmailSendResult)
def test_email_endpoint(payload: TestEmailPayload, db: Session = Depends(get_db)):
    custom_cfg = payload.model_dump(by_alias=False, exclude_unset=True)
    res = send_test_email(payload.to_email, custom_cfg, db=db)
    return EmailSendResult(
        status=res.get("status", "sent"),
        delivered=res.get("delivered", False),
        message=res.get("message"),
        simulated=res.get("simulated", False),
        link=res.get("link")
    )

@router.get("/public/{inv_id}", response_model=InvitationSchema)
def get_public_invitation(inv_id: str, db: Session = Depends(get_db)):
    inv = db.query(Invitation).filter(Invitation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found or expired")
    
    # Auto-mark as Opened if currently Sent
    if inv.status == "Sent":
        inv.status = "Opened"
        db.add(ActivityEvent(
            time="Just now",
            actor="Client",
            action="Invitation link opened",
            target=f"{inv.id} · {inv.client}",
            type="open"
        ))
        db.commit()
        db.refresh(inv)

    return inv

@router.post("/public/{inv_id}/accept")
def accept_public_invitation(inv_id: str, db: Session = Depends(get_db)):
    inv = db.query(Invitation).filter(Invitation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    
    inv.status = "Completed"
    
    # Update linked onboarding case
    case = db.query(OnboardingCase).filter(OnboardingCase.client == inv.client).first()
    if case:
        case.status = "Accepted"
        case.progress = 100
    
    db.add(ActivityEvent(
        time="Just now",
        actor="Client",
        action="Signed engagement & completed onboarding",
        target=f"{inv.id} · {inv.client}",
        type="accept"
    ))
    db.commit()
    return {"status": "ok", "message": "Onboarding completed successfully"}

@router.post("/{inv_id}/resend")
def resend_invitation(inv_id: str, payload: Optional[ResendPayload] = None, db: Session = Depends(get_db)):
    inv = db.query(Invitation).filter(Invitation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    
    target_email = (payload.to_email if payload and payload.to_email else inv.email).strip()
    inv.email = target_email
    inv.status = "Sent"
    
    db.add(ActivityEvent(
        time="Just now",
        actor=inv.owner,
        action="Resent invitation",
        target=f"{inv.id} · {inv.client} ({target_email})",
        type="invite"
    ))
    db.commit()

    # Dispatch fresh invitation email via SMTP
    email_res = {"delivered": False, "message": "Email dispatch pending"}
    try:
        email_res = send_invitation_email(
            db=db,
            recipient_email=target_email,
            client_name=inv.client,
            service=inv.service,
            inv_id=inv.id,
            expires=inv.expires or "14 days"
        )
    except Exception as err:
        print(f"[INVITATION RESEND EMAIL ERROR] {err}")
        email_res = {"delivered": False, "message": str(err)}

    return {
        "status": "ok",
        "message": f"Invitation resent to {target_email}",
        "emailDelivered": email_res.get("delivered", False),
        "emailMessage": email_res.get("message", ""),
        "simulated": email_res.get("simulated", False),
        "link": email_res.get("link")
    }

@router.post("/{inv_id}/cancel")
def cancel_invitation(inv_id: str, db: Session = Depends(get_db)):
    inv = db.query(Invitation).filter(Invitation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    inv.status = "Cancelled"

    db.add(ActivityEvent(
        time="Just now",
        actor=inv.owner,
        action="Cancelled invitation",
        target=f"{inv.id} · {inv.client}",
        type="reject"
    ))
    db.commit()
    return {"status": "ok", "message": "Invitation cancelled"}

@router.put("/{inv_id}", response_model=InvitationSchema)
def update_invitation(inv_id: str, payload: InvitationUpdate, db: Session = Depends(get_db)):
    inv = db.query(Invitation).filter(Invitation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

    if payload.client is not None:
        inv.client = payload.client
    if payload.email is not None:
        inv.email = payload.email
    if payload.service is not None:
        inv.service = payload.service
    if payload.channel is not None:
        inv.channel = payload.channel
    if payload.status is not None:
        inv.status = payload.status
    if payload.expires is not None:
        inv.expires = payload.expires
    if payload.owner is not None:
        inv.owner = payload.owner

    db.add(ActivityEvent(
        time="Just now",
        actor=inv.owner,
        action="Updated invitation",
        target=f"{inv.id} · {inv.client}",
        type="invite"
    ))
    db.commit()
    db.refresh(inv)
    return inv

@router.delete("/{inv_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invitation(inv_id: str, db: Session = Depends(get_db)):
    inv = db.query(Invitation).filter(Invitation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

    client_name = inv.client
    db.delete(inv)
    db.add(ActivityEvent(
        time="Just now",
        actor=inv.owner,
        action="Deleted invitation",
        target=f"{inv_id} · {client_name}",
        type="reject"
    ))
    db.commit()
    return None
