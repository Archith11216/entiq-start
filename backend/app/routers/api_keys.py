from typing import List
from datetime import datetime
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ApiKey, ActivityEvent
from ..schemas import ApiKeySchema, ApiKeyCreate

router = APIRouter(prefix="/api-keys", tags=["API Keys"])

@router.get("", response_model=List[ApiKeySchema])
def list_api_keys(db: Session = Depends(get_db)):
    return db.query(ApiKey).order_by(ApiKey.created_at.desc()).all()

@router.post("", response_model=ApiKeySchema, status_code=status.HTTP_201_CREATED)
def create_api_key(payload: ApiKeyCreate, db: Session = Depends(get_db)):
    raw_key = payload.key or f"entiq_live_{secrets.token_hex(16)}"
    key_id = f"key-{secrets.token_hex(4)}"

    new_key = ApiKey(
        id=key_id,
        key=raw_key,
        name=payload.name,
        is_active=True,
        created_at=datetime.utcnow(),
    )
    db.add(new_key)
    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Created API Key",
        target=f"{new_key.name} ({new_key.key[:12]}…)",
        type="accept",
    ))
    db.commit()
    db.refresh(new_key)
    return new_key

@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(key_id: str, db: Session = Depends(get_db)):
    key_record = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not key_record:
        raise HTTPException(status_code=404, detail="API Key not found")

    key_name = key_record.name
    # Don't delete master key, just deactivate
    key_record.is_active = False
    db.add(ActivityEvent(
        time="Just now",
        actor="Partner",
        action="Revoked API Key",
        target=f"{key_id} · {key_name}",
        type="reject",
    ))
    db.commit()
    return None
