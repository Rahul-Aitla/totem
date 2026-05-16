from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON, ForeignKey, Integer, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.sql import func
import uuid
from .database import Base

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String(255), primary_key=True)
    user_agent = Column(String(500))
    ip_address = Column(String(50))  # Simplified from INET for now
    total_interactions = Column(Integer, default=0)
    total_memories = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True))

class VoiceLog(Base):
    __tablename__ = "voice_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_session_id = Column(String(255), ForeignKey("sessions.id"))
    voice_message_number = Column(Integer, default=1)
    raw_audio_url = Column(String(2048))
    audio_duration_seconds = Column(Numeric(5, 2))
    transcribed_text = Column(Text, nullable=False)
    language_detected = Column(String(20))
    language_confidence = Column(Numeric(5, 4))
    audio_noise_level = Column(Numeric(5, 2))
    processing_latency_ms = Column(Integer)
    status = Column(String(50), default='completed')
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Intent(Base):
    __tablename__ = "intents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    voice_log_id = Column(UUID(as_uuid=True), ForeignKey("voice_logs.id", ondelete="CASCADE"), nullable=False)
    extracted_task = Column(String(500), nullable=False)
    format = Column(String(100))
    domain = Column(String(100))
    constraints = Column(JSONB, default={})
    audience = Column(String(255))
    intent_confidence = Column(Numeric(5, 4))
    extraction_method = Column(String(50), default='gemini')
    user_confirmed = Column(Boolean, default=False)
    confirmation_action = Column(String(20))
    confirmation_timestamp = Column(DateTime(timezone=True))
    user_note = Column(Text)
    status = Column(String(50), default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class OptimizedPrompt(Base):
    __tablename__ = "optimized_prompts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intent_id = Column(UUID(as_uuid=True), ForeignKey("intents.id", ondelete="CASCADE"), nullable=False)
    voice_log_id = Column(UUID(as_uuid=True), ForeignKey("voice_logs.id", ondelete="CASCADE"), nullable=False)
    original_text = Column(Text, nullable=False)
    optimized_text = Column(Text, nullable=False)
    reasoning = Column(Text)
    original_token_count = Column(Integer, nullable=False)
    optimized_token_count = Column(Integer, nullable=False)
    token_reduction_percentage = Column(Numeric(5, 2))
    optimization_method = Column(String(50))
    temperature = Column(Numeric(3, 2), default=0)
    was_used = Column(Boolean, default=False)
    times_copied = Column(Integer, default=0)
    times_saved = Column(Integer, default=0)
    user_feedback = Column(String(20))
    status = Column(String(50), default='completed')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_used_at = Column(DateTime(timezone=True))

class MemoryNode(Base):
    __tablename__ = "memory_nodes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_session_id = Column(String(255), ForeignKey("sessions.id"))
    memory_type = Column(String(50))
    fact_text = Column(Text, nullable=False)
    summary = Column(Text)
    # embedding = Column(Vector(384)) # Requires pgvector
    related_memory_ids = Column(ARRAY(UUID(as_uuid=True)))
    parent_memory_id = Column(UUID(as_uuid=True), ForeignKey("memory_nodes.id"))
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True))
    effectiveness_score = Column(Numeric(5, 2))
    user_rating = Column(Integer)
    merged_from_ids = Column(ARRAY(UUID(as_uuid=True)))
    is_merged = Column(Boolean, default=False)
    status = Column(String(50), default='active')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class DecisionLog(Base):
    __tablename__ = "decision_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_session_id = Column(String(255))
    voice_log_id = Column(UUID(as_uuid=True), ForeignKey("voice_logs.id"))
    intent_id = Column(UUID(as_uuid=True), ForeignKey("intents.id"))
    optimized_prompt_id = Column(UUID(as_uuid=True), ForeignKey("optimized_prompts.id"))
    step = Column(String(100), nullable=False)
    decision = Column(String(1000))
    decision_type = Column(String(50))
    reasoning = Column(JSONB)
    decision_metadata = Column(JSONB)
    metrics = Column(JSONB)
    was_successful = Column(Boolean)
    error_message = Column(Text)
    error_code = Column(String(50))
    user_input = Column(JSONB)
    system_output = Column(JSONB)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
