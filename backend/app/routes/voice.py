from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import os
import uuid
import time
from app.services.stt_service import stt_service
from app.services.memory_service import memory_service
from app.models import VoiceLog, Session as UserSession
from app.database import get_db

router = APIRouter(prefix="/voice", tags=["voice"])

@router.post("/upload")
async def upload_voice(
    audio: UploadFile = File(...),
    session_id: str = None,
    db: Session = Depends(get_db)
):
    """
    Upload voice file and transcribe
    Returns: {id, text, language, confidence}
    """
    start_time = time.time()
    
    # Ensure session exists
    if session_id:
        user_session = db.query(UserSession).filter(UserSession.id == session_id).first()
        if not user_session:
            user_session = UserSession(id=session_id)
            db.add(user_session)
            db.commit()
    else:
        session_id = "anonymous"
    
    try:
        # Save temp file
        temp_filename = f"{uuid.uuid4()}_{audio.filename}"
        temp_path = os.path.join("/tmp", temp_filename) if os.name != 'nt' else os.path.join(os.getenv('TEMP', 'temp'), temp_filename)
        
        # Ensure temp directory exists if not system temp
        if not os.path.exists(os.path.dirname(temp_path)):
            os.makedirs(os.path.dirname(temp_path))
            
        with open(temp_path, "wb") as f:
            f.write(await audio.read())
        
        # Transcribe with Deepgram
        result = await stt_service.transcribe(temp_path)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
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
