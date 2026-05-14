# Backend Schema & Database Design
## PostgreSQL Schema for Voice-Driven Prompt Optimization Engine

**Last Updated:** May 13, 2026  
**Version:** 1.0  
**Database:** PostgreSQL 16 (Supabase)

---

## 1. DATABASE OVERVIEW

### Design Principles
- **Normalization:** 3NF for data integrity
- **Performance:** Indexes on frequently queried columns
- **Auditability:** All decisions logged with timestamps
- **Scalability:** UUID primary keys for distributed systems
- **Flexibility:** JSONB for semi-structured data (constraints, metrics)

---

## 2. TABLE SCHEMAS

### Table 1: `voice_logs`
**Purpose:** Store all voice input and transcriptions

```sql
CREATE TABLE voice_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  user_session_id VARCHAR(255) NOT NULL,
  voice_message_number INT DEFAULT 1,
  
  -- Audio Data
  raw_audio_url VARCHAR(2048),           -- S3 or similar URL
  audio_duration_seconds DECIMAL(5,2),
  
  -- Transcription
  transcribed_text TEXT NOT NULL,
  language_detected VARCHAR(20),         -- 'en', 'hi', 'hinglish'
  language_confidence DECIMAL(5,4),      -- 0-1.0
  
  -- Quality Metrics
  audio_noise_level DECIMAL(5,2),        -- dB
  processing_latency_ms INT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed', -- 'processing', 'completed', 'failed'
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT fk_user_session FOREIGN KEY (user_session_id) REFERENCES sessions(id)
);

-- Indexes
CREATE INDEX idx_voice_logs_user_session ON voice_logs(user_session_id);
CREATE INDEX idx_voice_logs_created_at ON voice_logs(created_at DESC);
CREATE INDEX idx_voice_logs_language ON voice_logs(language_detected);
CREATE INDEX idx_voice_logs_status ON voice_logs(status);
```

---

### Table 2: `intents`
**Purpose:** Store extracted intents with user confirmation

```sql
CREATE TABLE intents (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  voice_log_id UUID NOT NULL REFERENCES voice_logs(id) ON DELETE CASCADE,
  
  -- Extracted Intent
  extracted_task VARCHAR(500) NOT NULL,      -- "Create marketing plan"
  format VARCHAR(100),                       -- "bullet_points", "paragraph"
  domain VARCHAR(100),                       -- "marketing", "technical"
  
  -- Constraints (Semi-structured)
  constraints JSONB DEFAULT '{}',            -- {max_words: 100, tone: professional}
  audience VARCHAR(255),
  
  -- Confidence & Quality
  intent_confidence DECIMAL(5,4),            -- Gemini confidence
  extraction_method VARCHAR(50) DEFAULT 'gemini',
  
  -- User Confirmation (CRITICAL)
  user_confirmed BOOLEAN DEFAULT FALSE,
  confirmation_action VARCHAR(20),           -- 'confirm', 'reject', 'clarify'
  confirmation_timestamp TIMESTAMP,
  user_note TEXT,                            -- Optional user clarification
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',      -- 'pending', 'confirmed', 'rejected'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT ck_confirmation_required CHECK (
    status IN ('pending', 'confirmed', 'rejected')
  )
);

-- Indexes
CREATE INDEX idx_intents_voice_log ON intents(voice_log_id);
CREATE INDEX idx_intents_confirmed ON intents(user_confirmed);
CREATE INDEX idx_intents_status ON intents(status);
CREATE INDEX idx_intents_domain ON intents(domain);
CREATE UNIQUE INDEX idx_intents_voice_log_latest ON intents(voice_log_id) 
  WHERE status = 'confirmed';
```

---

### Table 3: `optimized_prompts`
**Purpose:** Store final optimized prompts with metrics

```sql
CREATE TABLE optimized_prompts (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  intent_id UUID NOT NULL REFERENCES intents(id) ON DELETE CASCADE,
  voice_log_id UUID NOT NULL REFERENCES voice_logs(id) ON DELETE CASCADE,
  
  -- Original vs Optimized
  original_text TEXT NOT NULL,               -- Raw user input
  optimized_text TEXT NOT NULL,              -- Final MVP
  
  -- Token Metrics
  original_token_count INT NOT NULL,
  optimized_token_count INT NOT NULL,
  token_reduction_percentage DECIMAL(5,2),  -- Calculated
  
  -- Optimization Details
  optimization_method VARCHAR(50),           -- "gemini", "ollama"
  temperature DECIMAL(3,2) DEFAULT 0,       -- For reproducibility
  
  -- Usage Tracking
  was_used BOOLEAN DEFAULT FALSE,
  times_copied INT DEFAULT 0,
  times_saved INT DEFAULT 0,
  user_feedback VARCHAR(20),                 -- 'helpful', 'skip', 'improve'
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed',    -- 'processing', 'completed', 'failed'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  -- Triggers for calculations
  CONSTRAINT ck_valid_reduction CHECK (
    token_reduction_percentage BETWEEN 0 AND 100
  )
);

-- Indexes
CREATE INDEX idx_optimized_prompts_intent ON optimized_prompts(intent_id);
CREATE INDEX idx_optimized_prompts_voice_log ON optimized_prompts(voice_log_id);
CREATE INDEX idx_optimized_prompts_was_used ON optimized_prompts(was_used);
CREATE INDEX idx_optimized_prompts_feedback ON optimized_prompts(user_feedback);
CREATE INDEX idx_optimized_prompts_created_at ON optimized_prompts(created_at DESC);
```

---

### Table 4: `memory_nodes`
**Purpose:** Smart memory for context learning

```sql
CREATE TABLE memory_nodes (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  user_session_id VARCHAR(255) NOT NULL,
  memory_type VARCHAR(50),                   -- 'task', 'domain', 'pattern', 'constraint'
  
  -- Memory Content
  fact_text TEXT NOT NULL,                   -- Key extracted fact
  summary TEXT,                              -- Brief summary
  
  -- Vector Embedding (for similarity search)
  embedding VECTOR(384),                     -- HuggingFace sentence transformer
  
  -- Relationships
  related_memory_ids UUID[],                 -- Links to similar memories
  parent_memory_id UUID REFERENCES memory_nodes(id), -- Hierarchy
  
  -- Quality & Usage
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP,
  effectiveness_score DECIMAL(5,2),         -- 0-100 (does it help?)
  user_rating INT,                          -- 1-5 stars
  
  -- Merge Information
  merged_from_ids UUID[],                    -- If merged from other nodes
  is_merged BOOLEAN DEFAULT FALSE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',       -- 'active', 'archived', 'merged'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_user_session FOREIGN KEY (user_session_id) REFERENCES sessions(id)
);

-- Indexes
CREATE INDEX idx_memory_nodes_user_session ON memory_nodes(user_session_id);
CREATE INDEX idx_memory_nodes_type ON memory_nodes(memory_type);
CREATE INDEX idx_memory_nodes_status ON memory_nodes(status);
CREATE INDEX idx_memory_nodes_usage_count ON memory_nodes(usage_count DESC);
CREATE INDEX idx_memory_nodes_effectiveness ON memory_nodes(effectiveness_score DESC);
CREATE INDEX idx_memory_nodes_created_at ON memory_nodes(created_at DESC);

-- Vector index for similarity search
CREATE INDEX idx_memory_embedding ON memory_nodes USING ivfflat (embedding vector_cosine_ops);
```

---

### Table 5: `decision_logs`
**Purpose:** Complete audit trail of all system decisions

```sql
CREATE TABLE decision_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  user_session_id VARCHAR(255) NOT NULL,
  voice_log_id UUID REFERENCES voice_logs(id),
  intent_id UUID REFERENCES intents(id),
  optimized_prompt_id UUID REFERENCES optimized_prompts(id),
  
  -- Decision Information
  step VARCHAR(100) NOT NULL,                -- 'stt_complete', 'intent_confirmed', etc
  decision VARCHAR(1000),                    -- What was decided
  decision_type VARCHAR(50),                 -- 'system', 'user', 'automatic'
  
  -- Reasoning (Semi-structured)
  reasoning JSONB,                           -- Why: {confidence: 0.92, model: 'gemini'}
  metadata JSONB,                            -- Additional context
  
  -- Metrics
  metrics JSONB,                             -- {token_reduction: 48%, processing_time: 1200}
  
  -- Success Tracking
  was_successful BOOLEAN,
  error_message TEXT,
  error_code VARCHAR(50),
  
  -- Input/Output
  user_input JSONB,                          -- Original user data
  system_output JSONB,                       -- System output/response
  
  -- Timestamps
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_decision_logs_user_session ON decision_logs(user_session_id);
CREATE INDEX idx_decision_logs_timestamp ON decision_logs(timestamp DESC);
CREATE INDEX idx_decision_logs_step ON decision_logs(step);
CREATE INDEX idx_decision_logs_decision_type ON decision_logs(decision_type);
CREATE INDEX idx_decision_logs_success ON decision_logs(was_successful);
CREATE INDEX idx_decision_logs_voice_log ON decision_logs(voice_log_id);
```

---

### Table 6: `optimization_metrics`
**Purpose:** Aggregate metrics for analytics dashboard

```sql
CREATE TABLE optimization_metrics (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time Period
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_hour SMALLINT,                      -- 0-23 (for hourly tracking)
  
  -- Counts
  total_optimizations INT DEFAULT 0,
  successful_optimizations INT DEFAULT 0,
  failed_optimizations INT DEFAULT 0,
  
  -- Accuracy Metrics
  intent_accuracy_rate DECIMAL(5,4),         -- % correct intents
  avg_intent_confidence DECIMAL(5,4),
  
  -- Token Metrics
  avg_token_reduction_percentage DECIMAL(5,2),
  min_token_reduction DECIMAL(5,2),
  max_token_reduction DECIMAL(5,2),
  
  -- Performance Metrics
  avg_processing_time_ms DECIMAL(10,2),
  p95_processing_time_ms DECIMAL(10,2),
  p99_processing_time_ms DECIMAL(10,2),
  
  -- Memory Metrics
  total_memory_nodes INT DEFAULT 0,
  memory_effectiveness_score DECIMAL(5,2),
  
  -- User Feedback
  helpful_count INT DEFAULT 0,
  skip_count INT DEFAULT 0,
  improve_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT ck_accuracy_rate CHECK (intent_accuracy_rate BETWEEN 0 AND 1.0)
);

-- Indexes
CREATE INDEX idx_optimization_metrics_date ON optimization_metrics(metric_date DESC);
CREATE INDEX idx_optimization_metrics_hour ON optimization_metrics(metric_date, metric_hour);
```

---

### Table 7: `sessions`
**Purpose:** User session tracking

```sql
CREATE TABLE sessions (
  -- Primary Key
  id VARCHAR(255) PRIMARY KEY,
  
  -- Session Info
  user_agent VARCHAR(500),
  ip_address INET,
  
  -- Session Tracking
  total_interactions INT DEFAULT 0,
  total_memories INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  
  -- TTL
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

-- Indexes
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

---

## 3. VIEWS FOR ANALYTICS

### View 1: Session Summary
```sql
CREATE VIEW v_session_summary AS
SELECT 
  s.id as session_id,
  COUNT(DISTINCT vl.id) as total_optimizations,
  AVG(op.token_reduction_percentage) as avg_token_reduction,
  AVG(i.intent_confidence) as avg_intent_accuracy,
  COUNT(DISTINCT mn.id) as total_memory_nodes,
  s.created_at,
  s.last_activity_at
FROM sessions s
LEFT JOIN voice_logs vl ON s.id = vl.user_session_id
LEFT JOIN intents i ON vl.id = i.voice_log_id
LEFT JOIN optimized_prompts op ON i.id = op.intent_id
LEFT JOIN memory_nodes mn ON s.id = mn.user_session_id
GROUP BY s.id, s.created_at, s.last_activity_at;
```

### View 2: Decision Audit Trail
```sql
CREATE VIEW v_decision_audit_trail AS
SELECT 
  dl.timestamp,
  dl.step,
  dl.decision_type,
  dl.was_successful,
  dl.reasoning,
  dl.metrics,
  vl.transcribed_text,
  i.extracted_task,
  op.token_reduction_percentage
FROM decision_logs dl
LEFT JOIN voice_logs vl ON dl.voice_log_id = vl.id
LEFT JOIN intents i ON dl.intent_id = i.id
LEFT JOIN optimized_prompts op ON dl.optimized_prompt_id = op.id
ORDER BY dl.timestamp DESC;
```

---

## 4. SAMPLE DATA

### Insert Example Session
```sql
INSERT INTO sessions (id, user_agent, ip_address)
VALUES ('session_123', 'Mozilla/5.0...', '192.168.1.100');

INSERT INTO voice_logs (user_session_id, transcribed_text, language_detected, language_confidence)
VALUES ('session_123', 'Ek marketing plan bana do for gym app', 'hinglish', 0.98);

INSERT INTO intents (voice_log_id, extracted_task, format, domain, intent_confidence, user_confirmed)
VALUES (
  (SELECT id FROM voice_logs ORDER BY created_at DESC LIMIT 1),
  'Create marketing plan',
  'bullet_points',
  'marketing',
  0.92,
  true
);

INSERT INTO optimized_prompts (intent_id, voice_log_id, original_text, optimized_text, original_token_count, optimized_token_count)
VALUES (
  (SELECT id FROM intents ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM voice_logs ORDER BY created_at DESC LIMIT 1),
  'Ek marketing plan bana do for gym app',
  'You are a marketing strategist. Create a 3-step marketing plan for a gym app. Format: bullet points. Constraint: under 100 words.',
  35,
  18
);

-- Calculate token reduction
UPDATE optimized_prompts
SET token_reduction_percentage = ((original_token_count - optimized_token_count) / original_token_count * 100)
WHERE id = (SELECT id FROM optimized_prompts ORDER BY created_at DESC LIMIT 1);
```

---

## 5. DATABASE INITIALIZATION SCRIPT

### `init_db.py`
```python
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Read schema.sql
with open('schema.sql', 'r') as f:
    schema = f.read()

# Connect and execute
conn = psycopg2.connect("dbname=voice_optimization user=postgres")
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cursor = conn.cursor()

cursor.execute(schema)
cursor.close()
conn.close()

print("✓ Database schema initialized successfully")
```

---

## 6. MIGRATION STRATEGY

### Using Alembic (Python)
```bash
# Initialize Alembic
alembic init migrations

# Create migration
alembic revision --autogenerate -m "initial schema"

# Apply migration
alembic upgrade head
```

### Using Supabase (Recommended)
- Use Supabase SQL Editor
- Paste `schema.sql`
- Execute all tables
- Verify via Supabase Dashboard

---

## 7. BACKUP & RECOVERY

### Backup Strategy
```bash
# Daily full backup
pg_dump -h localhost -U postgres voice_optimization > backup_$(date +%Y%m%d).sql

# Weekly backup to S3
pg_dump voice_optimization | gzip | aws s3 cp - s3://backup-bucket/db_$(date +%Y%m%d).sql.gz
```

### Point-in-Time Recovery
- Supabase provides automated backups (7 days free)
- Access via: Dashboard → Backups → Restore

---

**Next:** See IMPLEMENTATION_PLAN.md for phase-by-phase execution guide.
