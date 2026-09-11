from typing import Optional
from datetime import datetime
import random
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import Engagement, ActivityEvent
from ..schemas import (
    EngagementSchema,
    EngagementCreate,
    EngagementStatusUpdate,
    EngagementUpdate,
    PaginatedResponse,
)

router = APIRouter(prefix="/engagements", tags=["Engagements"])

@router.get("", response_model=PaginatedResponse[EngagementSchema])
def list_engagements(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db)
):
    query = db.query(Engagement)

    if status and status != "All":
        query = query.filter(Engagement.status == status)

    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Engagement.client.ilike(pattern),
                Engagement.service.ilike(pattern),
                Engagement.id.ilike(pattern)
            )
        )

    total = query.count()
    items = query.order_by(Engagement.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse[EngagementSchema](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total
    )

@router.post("", response_model=EngagementSchema, status_code=status.HTTP_201_CREATED)
def create_engagement(engagement: EngagementCreate, db: Session = Depends(get_db)):
    eng_id = engagement.id or f"ENG-2024-0{random.randint(100, 999)}"
    new_eng = Engagement(
        id=eng_id,
        client=engagement.client,
        service=engagement.service,
        signed=engagement.signed or datetime.utcnow().strftime("%d %b %Y"),
        renewal_due=engagement.renewal_due or "",
        fee=engagement.fee or "$0 pa",
        status=engagement.status or "Active",
        adviser=engagement.adviser or "J. Okafor"
    )
    db.add(new_eng)

    db.add(ActivityEvent(
        time="Just now",
        actor=new_eng.adviser,
        action="Created engagement",
        target=f"{new_eng.id} · {new_eng.client} ({new_eng.fee})",
        type="proposal"
    ))

    db.commit()
    db.refresh(new_eng)
    return new_eng

@router.patch("/{eng_id}/status", response_model=EngagementSchema)
def update_engagement_status(eng_id: str, payload: EngagementStatusUpdate, db: Session = Depends(get_db)):
    eng = db.query(Engagement).filter(Engagement.id == eng_id).first()
    if not eng:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Engagement not found")

    eng.status = payload.status

    db.add(ActivityEvent(
        time="Just now",
        actor=eng.adviser,
        action=f"Updated engagement status to {payload.status}",
        target=f"{eng.id} · {eng.client}",
        type="accept" if payload.status == "Active" else "reject"
    ))

    db.commit()
    db.refresh(eng)
    return eng

@router.put("/{eng_id}", response_model=EngagementSchema)
def update_engagement(eng_id: str, payload: EngagementUpdate, db: Session = Depends(get_db)):
    eng = db.query(Engagement).filter(Engagement.id == eng_id).first()
    if not eng:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Engagement not found")

    if payload.client is not None:
        eng.client = payload.client
    if payload.service is not None:
        eng.service = payload.service
    if payload.fee is not None:
        eng.fee = payload.fee
    if payload.status is not None:
        eng.status = payload.status
    if payload.renewal_due is not None:
        eng.renewal_due = payload.renewal_due
    if payload.adviser is not None:
        eng.adviser = payload.adviser

    db.add(ActivityEvent(
        time="Just now",
        actor=eng.adviser,
        action="Updated engagement details",
        target=f"{eng.id} · {eng.client}",
        type="proposal"
    ))
    db.commit()
    db.refresh(eng)
    return eng

@router.delete("/{eng_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_engagement(eng_id: str, db: Session = Depends(get_db)):
    eng = db.query(Engagement).filter(Engagement.id == eng_id).first()
    if not eng:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Engagement not found")

    client_name = eng.client
    db.delete(eng)
    db.add(ActivityEvent(
        time="Just now",
        actor=eng.adviser,
        action="Deleted engagement",
        target=f"{eng_id} · {client_name}",
        type="reject"
    ))
    db.commit()
    return None
