# Technical Requirements Document (TRD)
## Voice-Driven Deterministic Prompt Optimization Engine

**Last Updated:** May 13, 2026  
**Version:** 1.0  
**Architecture:** Microservices (Frontend + Backend)

---

## 1. SYSTEM OVERVIEW

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14 + TypeScript | SSR, API routes, best DX |
| **Backend** | FastAPI (Python) | Async, built for ML, clean API docs |
| **STT** | Deepgram API | 99.5% accuracy, native Hinglish |
| **Intent/LLM** | Gemini API | Multilingual, deterministic extraction & optimization |
| **Database** | PostgreSQL 16 | Relational, full-text search, JSON support |
| **Hosting** | Vercel + Railway | Serverless + managed containers |
| **Visualization** | Vis.js | Network graphs, interactive |

---

## 2. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App (TypeScript)                                       │
│  ├─ VoiceRecorder (RecordRTC + Wavesurfer)                      │
│  ├─ IntentConfirmation Modal                                    │
│  ├─ PromptDisplay                                               │
│  ├─ GraphVisualization (Vis.js)                                 │
│  └─ ChatHistory + Analytics                                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────────┐
│                  BACKEND API (Railway)                          │
├─────────────────────────────────────────────────────────────────┤
│  FastAPI Server (Python)                                        │
│  ├─ Router: /api/voice                                          │
│  │  └─ POST /upload → Deepgram STT → confidence check           │
│  ├─ Router: /api/intent                                         │
│  │  └─ POST /detect → Gemini extraction + confirmation           │
│  ├─ Router: /api/prompt                                         │
│  │  └─ POST /optimize → Gemini optimization + token counter      │
│  ├─ Router: /api/memory                                         │
│  │  └─ CRUD operations + merge logic                            │
│  ├─ Router: /api/graph                                          │
│  │  └─ GET /path → decision path visualization                  │
│                                                                 │
│  Services:                                                       │
│  ├─ stt_service.py (Deepgram wrapper)                           │
│  ├─ intent_detector.py (Gemini-based)                           │
│  ├─ prompt_optimizer.py (Gemini-based)                          │
│  ├─ memory_allocator.py (smart context)                         │
│  ├─ noise_filter.py (text cleanup)                              │
│  └─ validation_layer.py (QA checks)                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │ 
┌──────────────────────▼──────────────────────────────────────────┐
│                  EXTERNAL APIs                                  │
├─────────────────────────────────────────────────────────────────┤
│  ├─ Deepgram API (STT: <200ms latency)                          │
│  └─ Google Gemini API (LLM: 60 req/min free)                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │ 
┌──────────────────────▼──────────────────────────────────────────┐
│                  DATA LAYER                                     │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL 16 (Supabase)                                       │
│  ├─ voice_logs (transcriptions + metadata)                      │
│  ├─ intents (extracted intents + confidence)                    │
│  ├─ optimized_prompts (outputs + token metrics)                 │
│  ├─ memory_nodes (facts + relationships)                        │
│  └─ decision_logs (audit trail)                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. FRONTEND ARCHITECTURE

### 3.1 Project Structure

```
frontend/
├── app/                           # Next.js app directory
│   ├── layout.tsx                 # Root layout + providers
│   ├── page.tsx                   # Home (chat interface)
│   ├── analytics/
│   │   └── page.tsx               # Analytics dashboard
│   ├── memory/
│   │   └── page.tsx               # Memory viewer
│   ├── api/
│   │   ├── voice/                 # API routes (proxies to backend)
│   │   │   └── upload.ts
│   │   ├── intent/
│   │   │   └── confirm.ts
│   │   ├── prompt/
│   │   │   └── optimize.ts
│   │   └── memory/
│   │       ├── list.ts
│   │       └── merge.ts
│   └── layout.module.css
│
├── components/                    # React components
│   ├── VoiceRecorder.tsx         # Recording + upload
│   ├── IntentConfirmation.tsx    # Confirmation modal
│   ├── PromptDisplay.tsx         # Output + metrics
│   ├── GraphVisualization.tsx    # Vis.js graph
│   ├── ChatHistory.tsx           # Conversation list
│   ├── MemoryViewer.tsx          # Memory nodes display
│   ├── Header.tsx                # Navigation
│   └── Footer.tsx                # Footer
│
├── services/                      # API client layer
│   ├── apiService.ts             # HTTP client (axios)
│   └── types.ts                  # Shared types
│
├── hooks/                         # Custom React hooks
│   ├── useVoiceRecorder.ts       # Recording logic
│   ├── usePromptOptimization.ts  # Optimization flow
│   └── useMemory.ts              # Memory management
│
├── utils/                         # Utilities
│   ├── tokenCounter.ts           # Token calculation
│   ├── formatters.ts             # String formatting
│   └── validators.ts             # Input validation
│
├── styles/                        # Global styles
│   ├── globals.css               # Tailwind + custom
│   └── animations.css            # Keyframe animations
│
├── public/                        # Static assets
│   └── icons/
│
├── lib/                           # Config
│   ├── env.ts                    # Environment variables
│   └── constants.ts              # App constants
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

### 3.2 Key Components

#### VoiceRecorder Component
```typescript
// Responsibilities:
- Capture microphone input (Web Audio API)
- Display waveform visualization (RecordRTC)
- Show recording status
- Upload encoded audio to backend

// Props:
{
  onTranscriptionStart: () => void
  onTranscriptionComplete: (text: string) => void
  onError: (error: string) => void
}
```

#### IntentConfirmation Component
```typescript
// Responsibilities:
- Display parsed intent in modal
- Show: "You want [task] with [format]. Confirm?"
- Handle Confirm/Reject/Clarify actions
- Log user decision

// State:
{
  intent: Intent
  isOpen: boolean
  isLoading: boolean
}
```

#### PromptDisplay Component
```typescript
// Responsibilities:
- Show optimized prompt
- Display token reduction % (before/after)
- Show token count metrics
- Copy-to-clipboard button
- Save/skip decision buttons

// Props:
{
  optimizedPrompt: string
  originalTokens: number
  optimizedTokens: number
  reductionPercentage: number
}

---

## 4. BACKEND ARCHITECTURE

### 4.1 FastAPI Project Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app + Socket.io setup
│   ├── config.py                  # Config (env vars, settings)
│   ├── models.py                  # SQLAlchemy ORM models
│   ├── schemas.py                 # Pydantic request/response schemas
│   ├── database.py                # Database connection + session
│   │
│   ├── routes/
│   │   ├── voice.py              # POST /api/voice/upload
│   │   ├── intent.py             # POST /api/intent/detect, confirm
│   │   ├── prompt.py             # POST /api/prompt/optimize
│   │   ├── memory.py             # CRUD /api/memory/*
│   │   └── graph.py              # GET /api/graph/path
│   │
│   ├── services/
│   │   ├── stt_service.py        # Deepgram STT wrapper
│   │   ├── intent_detector.py    # IndicBERT model + extraction
│   │   ├── prompt_optimizer.py   # Gemini API wrapper + optimization
│   │   ├── memory_allocator.py   # Smart memory logic
│   │   ├── noise_filter.py       # Text cleaning (filler words, etc)
│   │   ├── token_counter.py      # Gemini tokenizer wrapper
│   │   ├── validation_layer.py   # Intent/format/efficiency checks
│   │   └── graph_builder.py      # Decision path tracing
│   │
│   ├── utils/
│   │   ├── logger.py             # Structured logging
│   │   ├── exceptions.py         # Custom exceptions
│   │   └── helpers.py            # Utility functions
│   │
│   └── middleware/
│       ├── error_handler.py      # Global error handling
│       └── cors.py               # CORS configuration
│
├── database/
│   ├── schema.sql                # PostgreSQL schema
│   └── init_db.py               # Database initialization
│
├── tests/
│   ├── test_stt.py
│   ├── test_intent.py
│   ├── test_prompt.py
│   └── test_memory.py
│
├── requirements.txt              # Python dependencies
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

### 4.2 Service Layer Details

#### STT Service (stt_service.py)
```python
class DeepgramSTTService:
    - transcribe(audio_file) → (text, language, confidence)
    - handle_low_confidence(confidence < 60%) → re-ask user
    - detect_language() → language code
    - get_confidence_score() → 0-100%
```

#### Intent Detector (intent_detector.py)
```python
class IntentDetector:
    - extract_intent(text) → Intent (via Gemini API)
    - extract_entities(text) → {task, format, constraints, domain}
    - get_confidence() → 0-100%
    - validate_intent() → bool
```

#### Prompt Optimizer (prompt_optimizer.py)
```python
class PromptOptimizer:
    - optimize(intent) → OptimizedPrompt (via Gemini API)
    - inject_role(role) → enhanced_prompt
    - apply_constraints(constraints) → formatted_prompt
    - measure_token_reduction() → percentage
```

#### Memory Allocator (memory_allocator.py)
```python
class MemoryAllocator:
    - create_memory_node(data) → MemoryNode
    - find_similar_memories(query) → [MemoryNode]
    - merge_memories(node1, node2) → merged_node
    - retrieve_context(query) → [MemoryNode]
```

---

## 5. DATABASE SCHEMA

### 5.1 Tables

```sql
-- voice_logs: Store all transcriptions
CREATE TABLE voice_logs (
  id UUID PRIMARY KEY,
  user_session_id VARCHAR(255),
  raw_audio_url VARCHAR(2048),
  transcribed_text TEXT,
  language VARCHAR(10),           -- 'en', 'hi', 'hinglish'
  confidence_score FLOAT,         -- 0-100%
  processing_time_ms INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- intents: Extracted intents + user confirmation
CREATE TABLE intents (
  id UUID PRIMARY KEY,
  voice_log_id UUID REFERENCES voice_logs(id),
  extracted_task VARCHAR(500),
  format VARCHAR(100),            -- 'bullet_points', 'paragraph', etc
  constraints TEXT,               -- JSON: {max_words, domain, audience, etc}
  domain VARCHAR(100),
  confidence_score FLOAT,         -- NLP confidence (0-100%)
  user_confirmed BOOLEAN,
  user_confirmation_action VARCHAR(20), -- 'confirm', 'reject', 'clarify'
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- optimized_prompts: Final optimized prompts
CREATE TABLE optimized_prompts (
  id UUID PRIMARY KEY,
  intent_id UUID REFERENCES intents(id),
  original_prompt TEXT,           -- User's original request
  optimized_prompt TEXT,          -- Final MVP
  original_token_count INT,
  optimized_token_count INT,
  token_reduction_percentage FLOAT, -- (1 - opt/orig) * 100
  was_used BOOLEAN DEFAULT FALSE, -- User copy or use
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- memory_nodes: Smart memory for context learning
CREATE TABLE memory_nodes (
  id UUID PRIMARY KEY,
  session_id VARCHAR(255),
  fact_text TEXT,                 -- Key extracted fact
  embeddings VECTOR(384),         -- For similarity search
  related_memory_ids UUID[],      -- Links to other memories
  usage_count INT DEFAULT 0,      -- How many times used
  effectiveness_score FLOAT,      -- 0-100 (does it help?)
  created_at TIMESTAMP,
  last_used_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- decision_logs: Complete audit trail
CREATE TABLE decision_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP,
  step VARCHAR(100),              -- 'stt_complete', 'intent_confirmed', etc
  decision TEXT,                  -- What was decided
  reasoning TEXT,                 -- Why (JSON)
  metrics JSONB,                  -- Associated metrics
  success BOOLEAN,                -- Did it succeed?
  error_message VARCHAR(500),
  user_input JSONB,               -- Original user data
  system_output JSONB,            -- System output
  created_at TIMESTAMP
);

-- optimization_metrics: Track system performance
CREATE TABLE optimization_metrics (
  id UUID PRIMARY KEY,
  date DATE,
  total_optimizations INT,
  avg_token_reduction FLOAT,
  intent_accuracy_rate FLOAT,
  avg_processing_time_ms INT,
  memory_effectiveness_score FLOAT,
  created_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_voice_logs_user_session ON voice_logs(user_session_id);
CREATE INDEX idx_intents_voice_log ON intents(voice_log_id);
CREATE INDEX idx_optimized_prompts_intent ON optimized_prompts(intent_id);
CREATE INDEX idx_decision_logs_timestamp ON decision_logs(timestamp);
CREATE INDEX idx_decision_logs_step ON decision_logs(step);
CREATE INDEX idx_memory_nodes_session ON memory_nodes(session_id);
```

---

## 6. API SPECIFICATION

### 6.1 Voice Upload
```
POST /api/voice/upload
Content-Type: multipart/form-data

Request:
{
  "audio_file": <binary_audio>,
  "session_id": "user_session_123"
}

Response (200 OK):
{
  "id": "voice_log_uuid",
  "text": "Ek marketing plan bana do for gym app",
  "language": "hinglish",
  "confidence": 0.98,
  "processing_time_ms": 450
}

Response (400 Bad Request):
{
  "error": "Low confidence (0.45). Please try again."
}
```

### 6.2 Intent Detection
```
POST /api/intent/detect
Content-Type: application/json

Request:
{
  "text": "Ek marketing plan bana do for gym app",
  "voice_log_id": "voice_log_uuid"
}

Response (200 OK):
{
  "intent": {
    "task": "Create marketing plan",
    "format": "bullet_points",
    "constraints": {
      "max_words": 100,
      "audience": "gym_owners",
      "tone": "professional"
    },
    "domain": "marketing"
  },
  "confirmation_message": "You want to create a 3-step marketing plan for a gym app in bullet points. Confirm?",
  "confidence": 0.92
}
```

### 6.3 Intent Confirmation
```
POST /api/intent/confirm
Content-Type: application/json

Request:
{
  "intent_id": "intent_uuid",
  "confirmed": true,  // or false for rejection
  "action": "confirm" // 'confirm', 'reject', 'clarify'
}

Response (200 OK):
{
  "success": true,
  "message": "Intent confirmed. Proceeding to optimization."
}
```

### 6.4 Prompt Optimization
```
POST /api/prompt/optimize
Content-Type: application/json

Request:
{
  "intent_id": "intent_uuid"
}

Response (200 OK):
{
  "optimized_prompt": "You are a marketing strategist for gym apps. Create a 3-step marketing plan. Format: bullet points. Constraint: under 100 words.",
  "original_tokens": 35,
  "optimized_tokens": 18,
  "reduction_percentage": 48.6,
  "processing_time_ms": 1200
}
```

### 6.5 Memory CRUD
```
GET /api/memory/list
  → Returns all memory nodes for session

POST /api/memory/create
  → Create new memory from optimization

PATCH /api/memory/{id}/merge
  → Merge similar memories

DELETE /api/memory/{id}
  → Remove memory node
```

---

## 7. ERROR HANDLING

### Error Codes

| Code | Scenario | Action |
|------|----------|--------|
| 400 | Low STT confidence | Re-ask user to record |
| 400 | Invalid intent | Show clarification dialog |
| 429 | Rate limit (API) | Queue request, show wait message |
| 500 | Backend error | Show error, log to Sentry |
| 503 | External API down | Use cached/fallback response |

---

## 8. PERFORMANCE TARGETS

| Metric | Target | Implementation |
|--------|--------|-----------------|
| STT latency | <200ms | Deepgram real-time streaming |
| Intent detection | <500ms | Gemini API |
| LLM optimization | <2s | Gemini API |
| Total pipeline | <5s | All sequential + display |
| Database query | <100ms | Indexes + connection pooling |

---

## 9. SECURITY

### API Security
- HTTPS/TLS for all communications
- CORS restrictions (frontend URL only)
- Rate limiting (100 req/min per session)
- Input validation (Pydantic schemas)
- SQL injection prevention (SQLAlchemy ORM)

### Data Security
- No sensitive data in logs
- Audio files encrypted in transit
- Database encrypted at rest (Supabase)
- API keys in secure env vars (never in code)

---

## 10. MONITORING & LOGGING

```python
# Structured logging
{
  "timestamp": "2026-05-13T10:30:00Z",
  "service": "stt_service",
  "level": "INFO",
  "message": "STT complete",
  "metrics": {
    "processing_time_ms": 450,
    "confidence": 0.98,
    "language": "hinglish"
  }
}
```

---

**Next:** See APPFLOW.md for detailed user flows.
