from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.prompt_optimizer import prompt_optimizer
from app.services.memory_service import memory_service
from app.models import Intent, OptimizedPrompt, VoiceLog
from app.database import get_db
import uuid

router = APIRouter(prefix="/prompt", tags=["prompt"])

@router.post("/optimize")
async def optimize_prompt(
    intent_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate optimized prompt from intent
    """
    try:
        intent_uuid = uuid.UUID(intent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid intent_id format")

    intent = db.query(Intent).filter(Intent.id == intent_uuid).first()
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")
    
    if not intent.user_confirmed:
        raise HTTPException(status_code=400, detail="Intent not confirmed")
    
    # Get original text
    voice_log = db.query(VoiceLog).filter(VoiceLog.id == intent.voice_log_id).first()
    if not voice_log:
        raise HTTPException(status_code=404, detail="Original voice log not found")
        
    original_text = voice_log.transcribed_text
    
    # Count original tokens
    original_tokens = prompt_optimizer.count_tokens(original_text)
    
    # Get context from memory
    context = memory_service.get_relevant_context(db, voice_log.user_session_id)
    
    # Optimize
    try:
        result = prompt_optimizer.optimize(
            {
                'task': intent.extracted_task,
                'format': intent.format,
                'domain': intent.domain,
                'constraints': intent.constraints or {}
            },
            original_text,
            context=context
        )
    except Exception as e:
        print(f"CRITICAL ERROR in prompt_optimizer.optimize: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization service error: {str(e)}")
    
    if result['status'] == 'failed':
        print(f"OPTIMIZATION FAILED: {result.get('error')}")
        raise HTTPException(status_code=500, detail=result.get('error', 'Unknown optimization error'))
    
    # Count optimized tokens
    optimized_text = result['optimized_text']
    optimized_tokens = prompt_optimizer.count_tokens(optimized_text)
    
    # Calculate reduction
    reduction_pct = 0
    if original_tokens > 0:
        reduction_pct = ((original_tokens - optimized_tokens) / original_tokens) * 100
    
    # Save to database
    prompt_record = OptimizedPrompt(
        intent_id=intent_uuid,
        voice_log_id=intent.voice_log_id,
        original_text=original_text,
        optimized_text=optimized_text,
        original_token_count=original_tokens,
        optimized_token_count=optimized_tokens,
        token_reduction_percentage=reduction_pct,
        optimization_method="gemini-3-flash-preview"
    )
    db.add(prompt_record)
    db.commit()
    db.refresh(prompt_record)
    
    return {
        "id": str(prompt_record.id),
        "optimized_prompt": optimized_text,
        "original_tokens": original_tokens,
        "optimized_tokens": optimized_tokens,
        "reduction_percentage": round(float(reduction_pct), 2)
    }
