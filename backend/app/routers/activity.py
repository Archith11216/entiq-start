from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ActivityEvent
from ..schemas import ActivityEventSchema, ActivityEventCreate, PaginatedResponse
from ..utils import format_event_time

router = APIRouter(prefix="/activity", tags=["Activity"])

TYPE_MAP = {
    "Cases": ["accept", "reject", "assign"],
    "Invitations": ["invite", "open"],
    "Documents": ["upload", "reject"],
    "Identity": ["verify"],
    "Exceptions": ["exception"],
}

@router.get("", response_model=PaginatedResponse[ActivityEventSchema])
def list_activity(
    filter: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db)
):
    query = db.query(ActivityEvent)

    if filter and filter != "All":
        allowed_types = TYPE_MAP.get(filter)
        if allowed_types:
            query = query.filter(ActivityEvent.type.in_(allowed_types))

    total = query.count()
    raw_items = query.order_by(ActivityEvent.created_at.desc(), ActivityEvent.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = [
        ActivityEventSchema(
            id=item.id,
            time=format_event_time(item.created_at) if item.created_at else (item.time or "Just now"),
            actor=item.actor,
            action=item.action,
            target=item.target,
            type=item.type,
            created_at=item.created_at,
        )
        for item in raw_items
    ]

    return PaginatedResponse[ActivityEventSchema](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total
    )

@router.post("", response_model=ActivityEventSchema, status_code=status.HTTP_201_CREATED)
def log_activity(payload: ActivityEventCreate, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    event = ActivityEvent(
        time=payload.time or format_event_time(now),
        actor=payload.actor or "System",
        action=payload.action,
        target=payload.target,
        type=payload.type or "info",
        created_at=now
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return ActivityEventSchema(
        id=event.id,
        time=format_event_time(event.created_at),
        actor=event.actor,
        action=event.action,
        target=event.target,
        type=event.type,
        created_at=event.created_at,
    )
