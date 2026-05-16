from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.decision_service import decision_service
import uuid

router = APIRouter(prefix="/logs", tags=["logs"])

@router.get("/{session_id}")
async def get_session_logs(session_id: str, db: Session = Depends(get_db)):
    """Retrieve all decision logs for a session"""
    logs = decision_service.get_logs(db, session_id)
    return logs

@router.get("/details/{log_id}")
async def get_log_details(log_id: str, db: Session = Depends(get_db)):
    """Retrieve specific log details"""
    try:
        log_uuid = uuid.UUID(log_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid log_id format")
        
    from app.models import DecisionLog
    log = db.query(DecisionLog).filter(DecisionLog.id == log_uuid).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log
