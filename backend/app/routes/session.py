from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Session as UserSession, Intent, VoiceLog
from sqlalchemy import desc

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.get("/")
async def list_sessions(db: Session = Depends(get_db)):
    # Get last 10 sessions
    sessions = db.query(UserSession).order_by(desc(UserSession.last_activity_at)).limit(10).all()
    
    results = []
    for s in sessions:
        # Try to find a title from the first intent
        first_intent = db.query(Intent).join(VoiceLog).filter(VoiceLog.user_session_id == s.id).first()
        
        # If no intent, try the first voice log text
        if not first_intent:
            first_voice = db.query(VoiceLog).filter(VoiceLog.user_session_id == s.id).first()
            title = first_voice.transcribed_text[:30] + "..." if first_voice else "New Session"
        else:
            title = first_intent.extracted_task
            
        results.append({
            "id": s.id,
            "title": title,
            "created_at": s.created_at,
            "last_activity_at": s.last_activity_at
        })
        
    return results
