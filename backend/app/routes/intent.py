from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.intent_detector import intent_detector
from app.models import VoiceLog, Intent
from app.database import get_db
import uuid
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/intent", tags=["intent"])

class IntentConfirmRequest(BaseModel):
    confirmed: bool
    action: str = "confirm"

from app.services.memory_service import memory_service

@router.post("/extract")
async def detect_intent(
    voice_log_id: str,
    db: Session = Depends(get_db)
):
    """
    Extract intent from transcribed text
    Returns: confirmation message + intent details
    """
    try:
        voice_log_uuid = uuid.UUID(voice_log_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid voice_log_id format")

    voice_log = db.query(VoiceLog).filter(VoiceLog.id == voice_log_uuid).first()
    if not voice_log:
        raise HTTPException(status_code=404, detail="Voice log not found")
    
    # Get relevant context from memory for this session
    context = memory_service.get_relevant_context(db, voice_log.user_session_id)
    
    # Extract intent (Pass context to intent_detector if we update it, 
    # but for now let's just use the context to improve the prompt if needed)
    # Actually, let's update IntentDetector.extract_intent to accept context.
    intent_result = intent_detector.extract_intent(voice_log.transcribed_text, context=context)
    
    # Save to database
    intent = Intent(
        voice_log_id=voice_log_uuid,
        extracted_task=intent_result['task'],
        format=intent_result['format'],
        domain=intent_result['domain'],
        constraints=intent_result.get('constraints', {}),
        intent_confidence=intent_result['confidence'],
        status="pending"
    )
    db.add(intent)
    db.commit()
    db.refresh(intent)
    
    # Build confirmation message
    confirmation_msg = f"You want to {intent_result['task'].lower()} in {intent_result['format'].replace('_', ' ')}. Confirm?"
    
    return {
        "intent_id": str(intent.id),
        "intent": intent_result,
        "confirmation_message": confirmation_msg,
        "confidence": intent_result['confidence']
    }

@router.post("/confirm")
async def confirm_intent(
    intent_id: str,
    request: IntentConfirmRequest,
    db: Session = Depends(get_db)
):
    """
    User confirms or rejects intent
    """
    try:
        intent_uuid = uuid.UUID(intent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid intent_id format")

    intent = db.query(Intent).filter(Intent.id == intent_uuid).first()
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")
    
    intent.user_confirmed = request.confirmed
    intent.confirmation_action = request.action
    intent.status = "confirmed" if request.confirmed else "rejected"
    intent.confirmation_timestamp = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": "Proceeding to optimization" if request.confirmed else "Intent rejected",
        "status": intent.status
    }
