from typing import Optional, List
from datetime import datetime
import json
import random
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ServiceItem, FeeItem, StaffMember, ActivityEvent
from ..schemas import (
    ServiceItemSchema,
    ServiceItemCreate,
    FeeItemSchema,
    FeeItemCreate,
    StaffMemberSchema,
    StaffMemberCreate,
)

router = APIRouter(tags=["Services & Pricing"])

# ─── Services Catalogue ───────────────────────────────────────────────────────

@router.get("/services", response_model=List[ServiceItemSchema])
def list_services(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ServiceItem)
    if status and status != "All":
        query = query.filter(ServiceItem.status == status)
    items = query.order_by(ServiceItem.id.asc()).all()

    # Convert entity_types JSON text to list for schema
    res = []
    for item in items:
        try:
            et = json.loads(item.entity_types) if item.entity_types else []
        except Exception:
            et = [item.entity_types] if item.entity_types else []
        res.append(ServiceItemSchema(
            id=item.id,
            name=item.name,
            description=item.description or "",
            entity_types=et,
            scope=item.scope or "",
            status=item.status or "Active",
        ))
    return res

@router.post("/services", response_model=ServiceItemSchema, status_code=status.HTTP_201_CREATED)
def create_service(payload: ServiceItemCreate, db: Session = Depends(get_db)):
    svc_id = payload.id or f"SVC-{random.randint(100, 999)}"
    et_json = json.dumps(payload.entity_types or [])
    new_svc = ServiceItem(
        id=svc_id,
        name=payload.name,
        description=payload.description or "",
        entity_types=et_json,
        scope=payload.scope or "",
        status=payload.status or "Active",
        created_at=datetime.utcnow(),
    )
    db.add(new_svc)
    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Added service offering",
        target=f"{new_svc.id} · {new_svc.name}",
        type="accept",
    ))
    db.commit()
    db.refresh(new_svc)
    return ServiceItemSchema(
        id=new_svc.id,
        name=new_svc.name,
        description=new_svc.description or "",
        entity_types=payload.entity_types or [],
        scope=new_svc.scope or "",
        status=new_svc.status or "Active",
    )

@router.put("/services/{service_id}", response_model=ServiceItemSchema)
def update_service(service_id: str, payload: ServiceItemCreate, db: Session = Depends(get_db)):
    svc = db.query(ServiceItem).filter(ServiceItem.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    svc.name = payload.name
    svc.description = payload.description or ""
    svc.entity_types = json.dumps(payload.entity_types or [])
    svc.scope = payload.scope or ""
    if payload.status:
        svc.status = payload.status

    db.commit()
    db.refresh(svc)
    return ServiceItemSchema(
        id=svc.id,
        name=svc.name,
        description=svc.description or "",
        entity_types=payload.entity_types or [],
        scope=svc.scope or "",
        status=svc.status or "Active",
    )

@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: str, db: Session = Depends(get_db)):
    svc = db.query(ServiceItem).filter(ServiceItem.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(svc)
    db.commit()
    return None

# ─── Fees Schedule ────────────────────────────────────────────────────────────

@router.get("/fees", response_model=List[FeeItemSchema])
def list_fees(db: Session = Depends(get_db)):
    return db.query(FeeItem).order_by(FeeItem.id.asc()).all()

@router.post("/fees", response_model=FeeItemSchema, status_code=status.HTTP_201_CREATED)
def create_fee(payload: FeeItemCreate, db: Session = Depends(get_db)):
    fee_id = payload.id or f"FEE-{random.randint(100, 999)}"
    new_fee = FeeItem(
        id=fee_id,
        service=payload.service,
        basis=payload.basis or "Fixed",
        amount=payload.amount,
        frequency=payload.frequency or "Annual",
        gst=payload.gst,
        notes=payload.notes or "",
        created_at=datetime.utcnow(),
    )
    db.add(new_fee)
    db.commit()
    db.refresh(new_fee)
    return new_fee

@router.put("/fees/{fee_id}", response_model=FeeItemSchema)
def update_fee(fee_id: str, payload: FeeItemCreate, db: Session = Depends(get_db)):
    fee = db.query(FeeItem).filter(FeeItem.id == fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee item not found")

    fee.service = payload.service
    fee.basis = payload.basis or "Fixed"
    fee.amount = payload.amount
    fee.frequency = payload.frequency or "Annual"
    fee.gst = payload.gst
    fee.notes = payload.notes or ""

    db.commit()
    db.refresh(fee)
    return fee

@router.delete("/fees/{fee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fee(fee_id: str, db: Session = Depends(get_db)):
    fee = db.query(FeeItem).filter(FeeItem.id == fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee item not found")
    db.delete(fee)
    db.commit()
    return None

# ─── Staff Members & Rates ────────────────────────────────────────────────────

@router.get("/staff", response_model=List[StaffMemberSchema])
def list_staff(db: Session = Depends(get_db)):
    return db.query(StaffMember).order_by(StaffMember.id.asc()).all()

@router.post("/staff", response_model=StaffMemberSchema, status_code=status.HTTP_201_CREATED)
def create_staff(payload: StaffMemberCreate, db: Session = Depends(get_db)):
    stf_id = payload.id or f"STF-{random.randint(100, 999)}"
    new_stf = StaffMember(
        id=stf_id,
        name=payload.name,
        role=payload.role or "Accountant",
        rate=payload.rate,
        currency=payload.currency or "AUD",
        unit=payload.unit or "hour",
        email=payload.email or "",
        status=payload.status or "Active",
        created_at=datetime.utcnow(),
    )
    db.add(new_stf)
    db.commit()
    db.refresh(new_stf)
    return new_stf

@router.put("/staff/{staff_id}", response_model=StaffMemberSchema)
def update_staff(staff_id: str, payload: StaffMemberCreate, db: Session = Depends(get_db)):
    stf = db.query(StaffMember).filter(StaffMember.id == staff_id).first()
    if not stf:
        raise HTTPException(status_code=404, detail="Staff member not found")

    stf.name = payload.name
    stf.role = payload.role or "Accountant"
    stf.rate = payload.rate
    stf.currency = payload.currency or "AUD"
    stf.unit = payload.unit or "hour"
    stf.email = payload.email or ""
    if payload.status:
        stf.status = payload.status

    db.commit()
    db.refresh(stf)
    return stf

@router.delete("/staff/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_staff(staff_id: str, db: Session = Depends(get_db)):
    stf = db.query(StaffMember).filter(StaffMember.id == staff_id).first()
    if not stf:
        raise HTTPException(status_code=404, detail="Staff member not found")
    db.delete(stf)
    db.commit()
    return None
