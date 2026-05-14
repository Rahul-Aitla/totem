# Implementation Plan
## Phase-by-Phase Development Guide

**Last Updated:** May 13, 2026  
**Version:** 1.0  
**Total Duration:** 10 weeks  
**Team Size:** 1 Full-stack Developer (You)

---

## OVERVIEW

```
┌──────────────────────────────────────────────────────────────┐
│  IMPLEMENTATION TIMELINE                                     │
├──────────────────────────────────────────────────────────────┤
│  Phase 1 (Weeks 1-2):   Backend Foundation + STT             │
│  Phase 2 (Weeks 3-4):   Intent + Confirmation + Optimization │
│  Phase 3 (Weeks 5-6):   Frontend UI + Flow Integration       │
│  Phase 4 (Weeks 7-8):   Memory + Analytics + Graph           │
│  Phase 5 (Weeks 9-10):  Deployment + Documentation + Demo    │
│                                                              │
│  Total: 10 weeks → Production-Ready System                   │
└──────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: BACKEND FOUNDATION (Weeks 1-2)

### Objectives
- Set up FastAPI project structure
- Implement Deepgram STT integration
- Build Gemini intent detection
- Create PostgreSQL database schema
- Build voice upload endpoint

### Tasks

#### Week 1: Project Setup & Database

**Task 1.1: Initialize FastAPI Project** (4 hours)
```bash
# Create project structure
mkdir backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic google-generativeai

# Create files
touch main.py config.py models.py schemas.py database.py
mkdir routes services utils middleware
```

**Deliverables:**
- [ ] FastAPI app initialized at `backend/app/main.py`
- [ ] Project structure created
- [ ] Virtual environment working
- [ ] `uvicorn app.main:app --reload` runs successfully

**Task 1.2: Setup PostgreSQL & Supabase** (2 hours)
```bash
# Create Supabase project (free tier)
# 1. Go to supabase.com
# 2. Sign up (free)
# 3. Create new project
# 4. Copy connection string

# Set environment variables
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/voice_optimization
DEEPGRAM_API_KEY=your_deepgram_key
GEMINI_API_KEY=your_gemini_key
EOF
```

**Deliverables:**
- [ ] Supabase account created
- [ ] Database connection verified
- [ ] `.env` file with credentials
- [ ] Connection pooling configured

**Task 1.3: Create Database Schema** (3 hours)
```bash
# Execute schema.sql in Supabase SQL Editor
# 1. Copy content from BACKEND_SCHEMA.md
# 2. Paste into Supabase SQL Editor
# 3. Execute
# 4. Verify all tables created

# Or programmatically:
python database.py init
```

**Deliverables:**
- [ ] All 7 tables created (voice_logs, intents, etc.)
- [ ] Indexes created
- [ ] Sample data inserted
- [ ] Queries working (SELECT * FROM voice_logs)

**Task 1.4: Build SQLAlchemy ORM Models** (4 hours)
```python
# backend/app/models.py

from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON, UUID
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class VoiceLog(Base):
    __tablename__ = "voice_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_session_id = Column(String(255), nullable=False)
    transcribed_text = Column(String, nullable=False)
    language_detected = Column(String(20))
    language_confidence = Column(Float)
    status = Column(String(50), default='completed')
    created_at = Column(DateTime, default=datetime.utcnow)

class Intent(Base):
    __tablename__ = "intents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    voice_log_id = Column(UUID(as_uuid=True), ForeignKey('voice_logs.id'))
    extracted_task = Column(String(500))
    format = Column(String(100))
    domain = Column(String(100))
    intent_confidence = Column(Float)
    user_confirmed = Column(Boolean, default=False)
    status = Column(String(50), default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)

# ... Similar for OptimizedPrompt, MemoryNode, DecisionLog
```

**Deliverables:**
- [ ] All models defined in `models.py`
- [ ] ForeignKey relationships correct
- [ ] Timestamps implemented
- [ ] Models tested with Alembic or manual migration

---

#### Week 2: STT & Intent Detection

**Task 2.1: Deepgram STT Integration** (4 hours)
```python
# backend/app/services/stt_service.py

from deepgram import DeepgramClient, FileSource
import os

class DeepgramSTTService:
    def __init__(self):
        self.client = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"))
    
    def transcribe(self, audio_file):
        """
        Transcribe audio using Deepgram
        Returns: {text, language, confidence}
        """
        with open(audio_file, 'rb') as f:
            buffer_data = f.read()
        
        payload = FileSource(buffer_data, "audio/wav")
        options = {
            "model": "nova-2",
            "language": "hi",  # Hindi/Hinglish
            "include_confidence": True,
        }
        
        response = self.client.listen.prerecorded.v("1").transcribe_file(
            payload,
            options
        )
        
        # Parse response
        transcript = response['results']['channels'][0]['alternatives'][0]['transcript']
        confidence = response['results']['channels'][0]['alternatives'][0].get('confidence', 0)
        language = "hinglish" if "hi" in str(response) else "en"
        
        return {
            "text": transcript,
            "language": language,
            "confidence": confidence
        }

# Test
service = DeepgramSTTService()
result = service.transcribe("test_audio.wav")
assert result['confidence'] > 0.6  # Confidence check
```

**Deliverables:**
- [ ] `stt_service.py` created and tested
- [ ] Deepgram API key configured
- [ ] Test audio files transcribed
- [ ] Confidence scoring working
- [ ] Error handling for low confidence

**Task 2.2: Gemini Intent Detection** (4 hours)
```python
# backend/app/services/intent_detector.py

import google.generativeai as genai
import os
import json

class IntentDetector:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    def extract_intent(self, text):
        """
        Extract intent from text using Gemini
        Returns: {task, format, domain, confidence}
        """
        prompt = f"""
        Extract the user's intent from the following text (which may be in English, Hindi, or Hinglish).
        Text: "{text}"
        
        Return a JSON object with:
        - task: The main action requested.
        - format: Preferred output format (e.g., bullet_points, paragraph, code).
        - domain: The subject area (e.g., marketing, technical, creative).
        - confidence: A score from 0.0 to 1.0 based on clarity.
        
        ONLY return the JSON object.
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Simple parsing for MVP
            data = json.loads(response.text.strip().replace('```json', '').replace('```', ''))
            return data
        except Exception as e:
            return {
                "task": "General task",
                "format": "default",
                "domain": "general",
                "confidence": 0.5
            }

# Test
detector = IntentDetector()
result = detector.extract_intent("Ek marketing plan bana do for gym app")
print(result)
```

**Deliverables:**
- [ ] `intent_detector.py` created
- [ ] Gemini API integration for intent working
- [ ] Intent extraction working on test inputs
- [ ] Entity extraction (task, format, domain)
- [ ] Confidence scoring implemented

**Task 2.3: Voice Upload Endpoint** (3 hours)
```python
# backend/app/routes/voice.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.services.stt_service import DeepgramSTTService
from app.models import VoiceLog
from app.database import get_db

router = APIRouter(prefix="/api/voice", tags=["voice"])
stt_service = DeepgramSTTService()

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
    try:
        # Save temp file
        temp_path = f"/tmp/{audio.filename}"
        with open(temp_path, "wb") as f:
            f.write(await audio.read())
        
        # Transcribe with Deepgram
        result = stt_service.transcribe(temp_path)
        
        # Check confidence
        if result['confidence'] < 0.6:
            raise HTTPException(
                status_code=400,
                detail=f"Low confidence ({result['confidence']:.0%}). Please try again."
            )
        
        # Save to database
        voice_log = VoiceLog(
            user_session_id=session_id or "anonymous",
            transcribed_text=result['text'],
            language_detected=result['language'],
            language_confidence=result['confidence']
        )
        db.add(voice_log)
        db.commit()
        db.refresh(voice_log)
        
        return {
            "id": str(voice_log.id),
            "text": result['text'],
            "language": result['language'],
            "confidence": result['confidence']
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Add to main.py
from app.routes import voice
app.include_router(voice.router)
```

**Deliverables:**
- [ ] `/api/voice/upload` endpoint created
- [ ] File upload handling working
- [ ] Deepgram transcription working
- [ ] Database storage working
- [ ] Error handling (low confidence, failures)
- [ ] Tested with Postman/curl

**Task 2.4: Testing & Validation** (1 hour)
```bash
# Test voice upload
curl -X POST http://localhost:8000/api/voice/upload \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@test_audio.wav" \
  -F "session_id=test_session_123"

# Expected response:
# {
#   "id": "voice_log_uuid",
#   "text": "Ek marketing plan bana do for gym app",
#   "language": "hinglish",
#   "confidence": 0.98
# }
```

**Deliverables:**
- [ ] Phase 1 integration tests pass
- [ ] All endpoints working
- [ ] Database populated with test data
- [ ] Error scenarios handled

---

## PHASE 2: INTENT & OPTIMIZATION (Weeks 3-4)

### Objectives
- Build intent confirmation endpoint
- Implement Gemini LLM integration
- Create prompt optimization engine
- Add validation layer
- Implement noise filtering

### Tasks

#### Week 3: Intent & Confirmation

**Task 3.1: Intent Detection Endpoint** (3 hours)
```python
# backend/app/routes/intent.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.intent_detector import IntentDetector
from app.models import VoiceLog, Intent
from app.database import get_db

router = APIRouter(prefix="/api/intent", tags=["intent"])
intent_detector = IntentDetector()

@router.post("/detect")
async def detect_intent(
    voice_log_id: str,
    db: Session = Depends(get_db)
):
    """
    Extract intent from transcribed text
    Returns: confirmation message + intent details
    """
    voice_log = db.query(VoiceLog).filter(VoiceLog.id == voice_log_id).first()
    if not voice_log:
        raise HTTPException(status_code=404, detail="Voice log not found")
    
    # Extract intent
    intent_result = intent_detector.extract_intent(voice_log.transcribed_text)
    
    # Save to database
    intent = Intent(
        voice_log_id=voice_log_id,
        extracted_task=intent_result['task'],
        format=intent_result['format'],
        domain=intent_result['domain'],
        intent_confidence=intent_result['confidence'],
        status="pending"  # Waiting for user confirmation
    )
    db.add(intent)
    db.commit()
    
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
    confirmed: bool,
    action: str,
    db: Session = Depends(get_db)
):
    """
    User confirms or rejects intent
    Actions: 'confirm', 'reject', 'clarify'
    """
    intent = db.query(Intent).filter(Intent.id == intent_id).first()
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")
    
    intent.user_confirmed = confirmed
    intent.confirmation_action = action
    intent.status = "confirmed" if confirmed else "rejected"
    
    db.commit()
    
    return {
        "success": True,
        "message": "Proceeding to optimization" if confirmed else "Intent rejected"
    }
```

**Deliverables:**
- [ ] `/api/intent/detect` endpoint working
- [ ] `/api/intent/confirm` endpoint working
- [ ] Confirmation messages generated correctly
- [ ] User confirmation tracked in database

**Task 3.2: Gemini LLM Integration** (4 hours)
```python
# backend/app/services/prompt_optimizer.py

import google.generativeai as genai
import os

class PromptOptimizer:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    def optimize(self, intent, original_text):
        """
        Optimize intent into minimum viable prompt
        Temperature=0 for deterministic output
        """
        system_prompt = f"""
        You are an expert prompt engineer. Your task is to transform raw user input into a clean, minimal, token-efficient prompt.
        
        Input intent:
        - Task: {intent['task']}
        - Format: {intent['format']}
        - Domain: {intent['domain']}
        - Constraints: {intent.get('constraints', {})}
        
        Rules:
        1. Remove all filler words (um, uh, you know, like, basically)
        2. Compress verbose language
        3. Add role definition
        4. Inject output format constraint
        5. Keep output under 50 tokens where possible
        6. Output should be directly usable by an LLM
        
        Original text: "{original_text}"
        
        Generate ONLY the optimized prompt. No explanation.
        """
        
        try:
            response = self.model.generate_content(
                system_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.0,  # Deterministic
                    top_p=1.0,
                    top_k=1,
                    max_output_tokens=256
                )
            )
            
            optimized_text = response.text.strip()
            
            return {
                "optimized_text": optimized_text,
                "status": "success"
            }
        except Exception as e:
            return {
                "error": str(e),
                "status": "failed"
            }
    
    def count_tokens(self, text):
        """Count tokens in text using Gemini tokenizer"""
        try:
            response = self.model.count_tokens(text)
            return response.total_tokens
        except:
            # Fallback: rough estimate (1 token ≈ 4 chars)
            return len(text) // 4

# Test
optimizer = PromptOptimizer()
intent = {
    'task': 'Create marketing plan',
    'format': 'bullet_points',
    'domain': 'marketing',
    'constraints': {'max_words': 100}
}
result = optimizer.optimize(intent, "Ek marketing plan bana do for gym app")
print(result)
```

**Deliverables:**
- [ ] `prompt_optimizer.py` created
- [ ] Gemini API integration working
- [ ] Deterministic output (temperature=0)
- [ ] Token counting implemented
- [ ] Error handling in place

#### Week 4: Optimization & Validation

**Task 4.1: Prompt Optimization Endpoint** (3 hours)
```python
# backend/app/routes/prompt.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.prompt_optimizer import PromptOptimizer
from app.models import Intent, OptimizedPrompt, VoiceLog
from app.database import get_db

router = APIRouter(prefix="/api/prompt", tags=["prompt"])
optimizer = PromptOptimizer()

@router.post("/optimize")
async def optimize_prompt(
    intent_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate optimized prompt from intent
    """
    intent = db.query(Intent).filter(Intent.id == intent_id).first()
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")
    
    if not intent.user_confirmed:
        raise HTTPException(status_code=400, detail="Intent not confirmed")
    
    # Get original text
    voice_log = db.query(VoiceLog).filter(VoiceLog.id == intent.voice_log_id).first()
    original_text = voice_log.transcribed_text
    
    # Count original tokens
    original_tokens = optimizer.count_tokens(original_text)
    
    # Optimize
    result = optimizer.optimize(
        {
            'task': intent.extracted_task,
            'format': intent.format,
            'domain': intent.domain,
            'constraints': intent.constraints or {}
        },
        original_text
    )
    
    if result['status'] == 'failed':
        raise HTTPException(status_code=500, detail=result['error'])
    
    # Count optimized tokens
    optimized_text = result['optimized_text']
    optimized_tokens = optimizer.count_tokens(optimized_text)
    
    # Calculate reduction
    reduction_pct = ((original_tokens - optimized_tokens) / original_tokens) * 100
    
    # Save to database
    prompt_record = OptimizedPrompt(
        intent_id=intent_id,
        voice_log_id=intent.voice_log_id,
        original_text=original_text,
        optimized_text=optimized_text,
        original_token_count=original_tokens,
        optimized_token_count=optimized_tokens,
        token_reduction_percentage=reduction_pct
    )
    db.add(prompt_record)
    db.commit()
    
    return {
        "id": str(prompt_record.id),
        "optimized_prompt": optimized_text,
        "original_tokens": original_tokens,
        "optimized_tokens": optimized_tokens,
        "reduction_percentage": round(reduction_pct, 2)
    }
```

**Deliverables:**
- [ ] `/api/prompt/optimize` endpoint working
- [ ] Token reduction calculated
- [ ] Results stored in database
- [ ] Tested with real data

**Task 4.2: Validation Layer** (2 hours)
```python
# backend/app/services/validation_layer.py

class ValidationLayer:
    def validate_intent(self, intent):
        """Check intent alignment"""
        checks = {
            'has_task': bool(intent.get('task')),
            'has_format': bool(intent.get('format')),
            'confidence_gt_60': intent.get('confidence', 0) > 0.6
        }
        return all(checks.values())
    
    def validate_format(self, optimized_prompt):
        """Check output format"""
        checks = {
            'not_empty': len(optimized_prompt.strip()) > 0,
            'not_too_long': len(optimized_prompt) < 2000,
            'has_content': optimized_prompt.count(' ') > 2  # At least 3 words
        }
        return all(checks.values())
    
    def validate_token_efficiency(self, original_tokens, optimized_tokens):
        """Check token reduction"""
        if original_tokens <= 0:
            return False
        
        reduction = ((original_tokens - optimized_tokens) / original_tokens) * 100
        return reduction >= 20  # At least 20% reduction

validator = ValidationLayer()
```

**Deliverables:**
- [ ] `validation_layer.py` created
- [ ] All validation checks implemented
- [ ] Integrated into optimization pipeline

**Task 4.3: Testing & Metrics** (1 hour)
```bash
# Test full pipeline
1. POST /api/voice/upload with test audio
2. GET intent_id
3. POST /api/intent/confirm with intent_id
4. POST /api/prompt/optimize with intent_id
5. Verify token reduction > 30%

# Expected metrics
- Intent accuracy: >90%
- Token reduction: 30-50%
- Processing time: <5s total
```

**Deliverables:**
- [ ] Phase 2 integration tests pass
- [ ] Full pipeline working (voice → optimization)
- [ ] Metrics meeting targets
- [ ] Database populated

---

## PHASE 3: FRONTEND DEVELOPMENT (Weeks 5-6)

### Objectives
- Build React components
- Implement voice recording
- Create efficient state management for optimization flow
- Build confirmation modal
- Create chat interface

### Tasks

**Week 5 & 6:** (Detailed in separate FRONTEND_IMPLEMENTATION.md)

**Key Components:**
- [ ] `VoiceRecorder.tsx` - RecordRTC integration
- [ ] `IntentConfirmation.tsx` - Modal
- [ ] `PromptDisplay.tsx` - Output + metrics
- [ ] `ChatHistory.tsx` - Conversation
- [ ] `GraphVisualization.tsx` - Vis.js graph
- [ ] API routes as middleware

---

## PHASE 4: MEMORY & ANALYTICS (Weeks 7-8)

**Key Tasks:**
- [ ] Memory allocator logic
- [ ] Memory CRUD endpoints
- [ ] Memory merge functionality
- [ ] Analytics dashboard
- [ ] Graph visualization

---

## PHASE 5: DEPLOYMENT & POLISH (Weeks 9-10)

**Key Tasks:**
- [ ] Docker setup (backend + frontend)
- [ ] Railway deployment (backend)
- [ ] Vercel deployment (frontend)
- [ ] Comprehensive README
- [ ] API documentation (Swagger)
- [ ] Demo video recording
- [ ] Final testing & bug fixes

---

## TESTING STRATEGY

### Unit Tests (Per Phase)
```bash
# Backend
pytest tests/test_stt.py
pytest tests/test_intent.py
pytest tests/test_prompt.py

# Frontend
npm run test
```

### Integration Tests
```bash
# Full pipeline tests
python tests/test_full_pipeline.py

# Expected: All steps complete in <5s
```

### Acceptance Tests
- [ ] Intent accuracy >90% (manual review of 20 samples)
- [ ] Token reduction 30-50% (automated calculation)
- [ ] Determinism verified (same input = same output, 10 tests)
- [ ] Hinglish support confirmed
- [ ] Memory learning verified

---

## DEPLOYMENT CHECKLIST

### Backend (Railway)
- [ ] Docker image builds
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] API endpoints responsive
- [ ] Error monitoring (Sentry)

### Frontend (Vercel)
- [ ] Build succeeds
- [ ] Environment variables set
- [ ] API routes working
- [ ] Mobile responsive
- [ ] Performance optimized

---

## SUCCESS CRITERIA

| Criteria | Target | Status |
|----------|--------|--------|
| Intent Accuracy | >90% | ☐ |
| Voice Handling | 99.5% | ☐ |
| Token Reduction | 30-50% | ☐ |
| Determinism | 100% | ☐ |
| Response Time | <5s | ☐ |
| Uptime | 99.9% | ☐ |
| Code Quality | 90+ score | ☐ |
| Documentation | Complete | ☐ |

---

**Estimated Weekly Effort:** 35-40 hours/week
**Start Date:** [Your Date]
**Target Completion:** 10 weeks from start

---

**Notes for Success:**
1. Follow phase-by-phase execution strictly
2. Test at end of each phase before moving forward
3. Document decisions & blockers daily
4. Use environment variables for API keys (never commit)
5. Make small commits to Git frequently
6. Request feedback after Phase 3 (Frontend)

---

**Next Steps:** Begin Phase 1 implementation!
