from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status, Depends, Request
from sqlalchemy.orm import Session
from .database import get_db
from .models import ApiKey

DEFAULT_MASTER_KEY = "entiq_live_sec_7f9c2d1b8e4a3f0"

def get_api_key_from_request(request: Request) -> Optional[str]:
    # 1. Check X-API-Key header
    api_key = request.headers.get("x-api-key")
    if api_key:
        return api_key.strip()

    # 2. Check Authorization header: Bearer <key> or ApiKey <key>
    auth_header = request.headers.get("authorization")
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() in ["bearer", "apikey"]:
            return parts[1].strip()

    # 3. Check query parameter: ?api_key=...
    query_key = request.query_params.get("api_key")
    if query_key:
        return query_key.strip()

    return None

def verify_api_key(request: Request, db: Session = Depends(get_db)) -> Optional[ApiKey]:
    """
    Enforces API key authentication, except for public client onboarding endpoints.
    """
    # Exemption for public client onboarding and health endpoints
    if "/public/" in request.url.path or request.url.path.endswith("/health"):
        return None

    key_val = get_api_key_from_request(request)

    if not key_val:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key required. Please provide a valid 'X-API-Key' header or bearer token.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # Check database for active key
    key_record = db.query(ApiKey).filter(ApiKey.key == key_val, ApiKey.is_active == True).first()

    if not key_record:
        # Check against master key fallback
        if key_val == DEFAULT_MASTER_KEY:
            key_record = ApiKey(
                id="key-master-001",
                key=DEFAULT_MASTER_KEY,
                name="Master Practice API Key",
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(key_record)
            db.commit()
            db.refresh(key_record)
        else:
            # Check if it is a valid JWT session token
            try:
                from .auth import decode_token
                payload = decode_token(key_val)
                user_id = payload.get("sub", "user")
                return ApiKey(
                    id=f"jwt-{user_id}",
                    key=key_val[:16],
                    name=f"Session User ({user_id})",
                    is_active=True,
                    created_at=datetime.utcnow()
                )
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or revoked API Key / Token.",
                    headers={"WWW-Authenticate": "ApiKey"},
                )

    # Update last used timestamp
    try:
        key_record.last_used_at = datetime.utcnow()
        db.commit()
    except Exception:
        db.rollback()

    return key_record
