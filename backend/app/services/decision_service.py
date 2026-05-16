from sqlalchemy.orm import Session
from app.models import DecisionLog
import uuid
from typing import Any, Optional

class DecisionService:
    def log_decision(
        self, 
        db: Session, 
        step: str, 
        user_session_id: str,
        decision: str,
        decision_type: str = "system",
        reasoning: Optional[dict] = None,
        metrics: Optional[dict] = None,
        voice_log_id: Optional[uuid.UUID] = None,
        intent_id: Optional[uuid.UUID] = None,
        optimized_prompt_id: Optional[uuid.UUID] = None,
        was_successful: bool = True,
        error_message: Optional[str] = None
    ):
        """Log a system decision to the database"""
        log = DecisionLog(
            user_session_id=user_session_id,
            voice_log_id=voice_log_id,
            intent_id=intent_id,
            optimized_prompt_id=optimized_prompt_id,
            step=step,
            decision=decision,
            decision_type=decision_type,
            reasoning=reasoning,
            metrics=metrics,
            was_successful=was_successful,
            error_message=error_message
        )
        db.add(log)
        db.commit()
        return log

    def get_logs(self, db: Session, user_session_id: str, limit: int = 50):
        """Retrieve decision logs for a session"""
        return db.query(DecisionLog).filter(
            DecisionLog.user_session_id == user_session_id
        ).order_by(DecisionLog.created_at.desc()).limit(limit).all()

decision_service = DecisionService()
