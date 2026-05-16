from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from sqlalchemy.orm import Session
import os
import uuid
import time
from app.services.stt_service import stt_service
from app.services.memory_service import memory_service
from app.services.decision_service import decision_service
from app.models import VoiceLog, Session as UserSession
from app.database import get_db

router = APIRouter(prefix="/voice", tags=["voice"])

@router.post("/upload")
async def upload_voice(
    audio: UploadFile = File(...),
    session_id: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload voice file and transcribe
    Returns: {id, text, language, confidence}
    """
    start_time = time.time()
    
    try:
        # Debugging logs
        audio_bytes = await audio.read()
        print(f"DEBUG: Filename: {audio.filename}")
        print(f"DEBUG: Content Type: {audio.content_type}")
        print(f"DEBUG: Byte length: {len(audio_bytes)}")
        
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        # Reset file pointer after reading for saving
        await audio.seek(0)

        # Ensure session exists
        if session_id:
            user_session = db.query(UserSession).filter(UserSession.id == session_id).first()
            if not user_session:
                user_session = UserSession(id=session_id)
                db.add(user_session)
                db.commit()
        else:
            session_id = "anonymous"
            # Ensure the anonymous session exists in the sessions table
            user_session = db.query(UserSession).filter(UserSession.id == session_id).first()
            if not user_session:
                user_session = UserSession(id=session_id)
                db.add(user_session)
                db.commit()
    
        # Save temp file
        temp_filename = f"{uuid.uuid4()}_{audio.filename}"
        # Use a more reliable temp path on Windows
        temp_dir = os.path.join(os.getcwd(), "temp_audio")
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
        temp_path = os.path.join(temp_dir, temp_filename)
            
        with open(temp_path, "wb") as f:
            f.write(await audio.read())
        
        # Transcribe with Deepgram
        result = await stt_service.transcribe(temp_path, mimetype=audio.content_type)
        
        if not result or "error" in result:
            error_msg = result.get("error", "Unknown STT error") if result else "STT service returned None"
            raise HTTPException(status_code=500, detail=error_msg)
        
        # Check confidence
        if result['confidence'] < 0.6:
            # Still save but notify
            status = 'low_confidence'
        else:
            status = 'completed'
            
        processing_latency = int((time.time() - start_time) * 1000)
        
        # Save to database
        voice_log = VoiceLog(
            user_session_id=session_id,
            transcribed_text=result['text'],
            language_detected=result['language'],
            language_confidence=result['confidence'],
            status=status,
            processing_latency_ms=processing_latency
        )
        db.add(voice_log)
        db.commit()
        db.refresh(voice_log)
        
        # Log decision
        decision_service.log_decision(
            db=db,
            step="STT_TRANSCRIPTION",
            user_session_id=session_id,
            voice_log_id=voice_log.id,
            decision=f"Transcribed audio with {result['language']} detection.",
            metrics={
                "confidence": float(result['confidence']),
                "latency_ms": processing_latency,
                "length_chars": len(result['text'])
            },
            reasoning={"model": "deepgram-whisper-v3"}
        )
        
        # Extract and store memory asynchronously (simplified: just call it here)
        memory_service.extract_and_store_memory(db, session_id, result['text'])
        
        # Clean up temp file
        try:
            os.remove(temp_path)
        except:
            pass
            
        return {
            "id": str(voice_log.id),
            "text": result['text'],
            "language": result['language'],
            "confidence": result['confidence'],
            "status": status
        }
    
    except Exception as e:
        db.rollback()
        print(f"Upload Route Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
