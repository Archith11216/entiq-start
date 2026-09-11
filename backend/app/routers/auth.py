from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, RefreshTokenRequest, AuthTokens, UserProfile
from ..auth import verify_password, create_access_token, create_refresh_token, decode_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=AuthTokens)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token(data={"sub": user.id, "email": user.email})

    return AuthTokens(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="Bearer",
        expires_in=86400
    )

@router.post("/refresh", response_model=AuthTokens)
def refresh(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    data = decode_token(payload.refresh_token)
    if data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user_id = data.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_access = create_access_token(data={"sub": user.id, "email": user.email})
    new_refresh = create_refresh_token(data={"sub": user.id, "email": user.email})

    return AuthTokens(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="Bearer",
        expires_in=86400
    )

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    return None

@router.get("/me", response_model=UserProfile)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
