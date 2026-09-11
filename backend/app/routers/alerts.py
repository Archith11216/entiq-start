from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ReviewAlert
from ..schemas import ReviewAlertSchema

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[ReviewAlertSchema])
def list_alerts(db: Session = Depends(get_db)):
    return db.query(ReviewAlert).filter(ReviewAlert.is_dismissed == False).all()

@router.post("/{alert_id}/dismiss", status_code=status.HTTP_204_NO_CONTENT)
def dismiss_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(ReviewAlert).filter(ReviewAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    alert.is_dismissed = True
    db.commit()
    return None
