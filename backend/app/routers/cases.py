from typing import Optional
from datetime import datetime, timedelta
import random
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import OnboardingCase, Engagement, ActivityEvent, ReviewAlert
from ..schemas import OnboardingCaseSchema, CaseStatusUpdate, CaseUpdate, PaginatedResponse, CaseInfoRequestPayload, CaseInfoRequestResponse
from ..email_service import send_info_request_email

router = APIRouter(prefix="/cases", tags=["Cases"])

@router.get("", response_model=PaginatedResponse[OnboardingCaseSchema])
def list_cases(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db)
):
    query = db.query(OnboardingCase)

    if status and status != "All":
        query = query.filter(OnboardingCase.status == status)

    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                OnboardingCase.client.ilike(pattern),
                OnboardingCase.entity.ilike(pattern),
                OnboardingCase.service.ilike(pattern),
                OnboardingCase.id.ilike(pattern)
            )
        )

    total = query.count()
    items = query.order_by(OnboardingCase.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse[OnboardingCaseSchema](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total
    )

@router.get("/{case_id}", response_model=OnboardingCaseSchema)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(OnboardingCase).filter(OnboardingCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case

@router.patch("/{case_id}/status", response_model=OnboardingCaseSchema)
@router.patch("/{case_id}", response_model=OnboardingCaseSchema)
def update_case_status(case_id: str, payload: CaseStatusUpdate, db: Session = Depends(get_db)):
    case = db.query(OnboardingCase).filter(OnboardingCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    case.status = payload.status
    if payload.status == "Accepted":
        case.progress = 100

        # Auto-create active engagement if not already present for this client
        existing_eng = db.query(Engagement).filter(Engagement.client.ilike(case.client)).first()
        if not existing_eng:
            now = datetime.utcnow()
            next_year = now + timedelta(days=365)
            new_eng = Engagement(
                id=f"ENG-2024-0{random.randint(100, 999)}",
                client=case.client,
                service=case.service,
                signed=now.strftime("%d %b %Y"),
                renewal_due=next_year.strftime("%d %b %Y"),
                fee="$4,950 pa",
                status="Active",
                adviser=case.owner
            )
            db.add(new_eng)
            
            # Log activity
            db.add(ActivityEvent(
                time="Just now",
                actor=case.owner,
                action="Accepted case & engagement",
                target=f"{new_eng.id} · {case.client} ($4,950 pa)",
                type="accept"
            ))

    db.commit()
    db.refresh(case)
    return case

@router.post("", response_model=OnboardingCaseSchema, status_code=status.HTTP_201_CREATED)
def create_case(case: OnboardingCaseSchema, db: Session = Depends(get_db)):
    new_case = OnboardingCase(**case.model_dump(by_alias=False))
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return new_case

@router.put("/{case_id}", response_model=OnboardingCaseSchema)
def update_case(case_id: str, payload: CaseUpdate, db: Session = Depends(get_db)):
    case = db.query(OnboardingCase).filter(OnboardingCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    update_data = payload.model_dump(exclude_unset=True, by_alias=False)
    for field, value in update_data.items():
        if value is not None:
            setattr(case, field, value)

    if case.status == "Accepted":
        case.progress = 100

    db.commit()
    db.refresh(case)
    return case

@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(OnboardingCase).filter(OnboardingCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    # Clean up review alerts associated with this case
    db.query(ReviewAlert).filter(ReviewAlert.case == case_id).delete()

    db.delete(case)
    db.commit()
    return None

@router.post("/{case_id}/request-info", response_model=CaseInfoRequestResponse)
def request_case_info(case_id: str, payload: CaseInfoRequestPayload, db: Session = Depends(get_db)):
    case = db.query(OnboardingCase).filter(OnboardingCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    result = send_info_request_email(
        db=db,
        recipient_email=payload.recipient_email,
        client_name=case.client,
        case_id=case.id,
        service=case.service,
        message=payload.message,
        requested_by=case.owner or "J. Okafor"
    )

    # Log an ActivityEvent for this request
    db.add(ActivityEvent(
        time="Just now",
        actor=case.owner or "J. Okafor",
        action="Requested additional information",
        target=f"{case.id} · {payload.recipient_email} — {payload.message[:80]}",
        type="request"
    ))
    db.commit()

    return CaseInfoRequestResponse(
        delivered=result.get("delivered", False),
        message=result.get("message", "Request dispatched successfully"),
        recipient_email=payload.recipient_email,
        status=result.get("status", "sent"),
        simulated=result.get("simulated", False)
    )
