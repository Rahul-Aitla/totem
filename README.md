# TOTEM — Voice-to-Prompt Optimization Engine

TOTEM converts raw voice input into structured, optimized AI prompts using speech-to-text, intent extraction, memory retrieval, and prompt compression. It focuses on deterministic, token-efficient prompts suitable for production LLM workflows.

Built with: FastAPI • Next.js 14 • Gemini (genai) • Deepgram • PostgreSQL + pgvector

---

## Table of Contents
- **Overview:** Short description and features
- **Quick Start:** Minimum steps to run locally
- **Architecture:** Mermaid diagram and component summary
- **Repository Structure:** Key files and folders
- **Prerequisites:** Tools and accounts required
- **Backend:** Setup, environment variables, Docker
- **Database (Supabase):** Schema, extensions, initialization
- **Frontend:** Setup, env vars, development and production
- **API Endpoints:** Examples and curl samples
- **Testing & Troubleshooting:** Common issues and fixes
- **Deployment:** Notes for Vercel / Docker / Supabase
- **Contributing & License**

---

## Pitch

TOTEM makes spoken requests usable for LLMs by:

- Transcribing speech to text (Deepgram)
- Extracting structured intent (Gemini)
- Confirming intent with the user before execution
- Compressing and optimizing prompts for token-efficiency (deterministic mode)
- Storing memories and building a decision graph for auditability

This README is a high-level project overview — deeper technical design and raw SQL lives in `BACKEND_SCHEMA.md` and the `/docs` folder.

## Overview

- **Purpose:** Turn spoken requests into a small, deterministic prompt that LLMs can use with minimal tokens and predictable behavior.
- **Key capabilities:** STT (Deepgram), Intent extraction (Gemini / genai), Intent confirmation, Prompt optimization (token reduction, CAVEMAN mode), Persistent memory (pgvector), Decision logs and graph visualization.

**What this repo contains:**
- Backend: FastAPI app with services and routes (STT, intent, prompt, memory, graph, logs).
- Frontend: Next.js 14 dashboard and UI for recording, confirming, and reviewing prompts/memories.
- DB schema & migration guidance: [BACKEND_SCHEMA.md](BACKEND_SCHEMA.md).

---

## Quick Start (Local)

1. Provision a Postgres database (Supabase recommended) and enable extensions (pgvector, pgcrypto).
2. Create a `.env` file in `backend/` with the required environment variables (see Backend → Env).
3. Run backend (virtualenv or Docker). See Backend section.
4. Configure frontend environment (`NEXT_PUBLIC_API_URL`) and run the Next.js dev server.

Example quick commands (Linux / macOS):
```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # create your .env with keys
python -m app.init_db  # create tables via SQLAlchemy models
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd ../frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Windows (PowerShell):
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.init_db
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd ..\frontend
npm install
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000"
npm run dev
```

---

## Architecture

```mermaid
flowchart LR
    A["Browser / Mobile"] -->|record audio| B["Frontend"]

    B -->|POST voice upload| C["Backend FastAPI"]

    C -->|STT Deepgram| D["Deepgram"]

    C -->|Intent extraction| E["Gemini"]

    C -->|Optimize prompt| F["Prompt Optimizer"]

    C -->|Store and query| G["Postgres"]

    C -->|Decision logs| H["Decision Logs"]

    G -->|similarity search| C

    B -->|Graph and Memory UI| C
```

- **Frontend:** Next.js app with dashboard pages (Memory, Workflow/Graph, Logs).
- **Backend:** FastAPI with modular services: stt_service, intent_detector, prompt_optimizer, memory_service, decision_service, graph_service.
- **Database:** Postgres 16 on Supabase (pgvector for embeddings). Tables and views are in [BACKEND_SCHEMA.md](BACKEND_SCHEMA.md).

---

## Repository Structure (high level)

- **BACKEND_SCHEMA.md:** canonical SQL schema + views
- **IMPLEMENTATION_PLAN.md, PRD.md, TRD.md, APPFLOW.md:** design and product docs
- **backend/**: FastAPI app and Dockerfile
  - `backend/app/config.py` — environment settings
  - `backend/app/database.py` — SQLAlchemy engine & session
  - `backend/app/models.py` — SQLAlchemy models
  - `backend/app/init_db.py` — create tables via SQLAlchemy
  - `backend/app/services/` — stt_service.py, intent_detector.py, prompt_optimizer.py, memory_service.py, decision_service.py
  - `backend/app/routes/` — voice.py, intent.py, prompt.py, memory.py, logs.py, graph.py
- **frontend/**: Next.js app, components, and `lib/api.ts` client

Refer to the files under the folders above for implementation details.

---

## Features

- Voice-to-text transcription using Deepgram
- Intent extraction using Gemini (genai)
- Intent confirmation UI flow
- Prompt optimization and token reduction (deterministic / temperature=0)
- Memory store with semantic embeddings (pgvector)
- Decision logging and session graph visualization
- Frontend dashboard (Next.js) for reviewing prompts, memories, and logs

## Tech Stack

- Frontend: Next.js 14, React 19, TailwindCSS (UI utilities)
- Backend: FastAPI, SQLAlchemy, Uvicorn, Python 3.11
- AI Services: Google Gemini (genai), Deepgram STT
- Database: PostgreSQL 16 (Supabase), pgvector for embeddings
- Hosting & Infra: Vercel (frontend), Railway/Render/Docker (backend), Supabase (DB)

## Screenshots

![Dashboard](docs/dashboard.png)

![Workflow](docs/workflow.png)

![User Memory](docs/memory.png)

---

## Prerequisites

- Node.js 18+ (Node 20 recommended)
- Python 3.11
- PostgreSQL 16 (Supabase recommended)
- Docker (optional, for container run)
- Accounts / API Keys:
  - Deepgram API key (STT)
  - Google Gemini / genai API key (LLM)
  - Supabase account (or managed Postgres)

---

## Backend — Setup & Run

1. Create and activate a Python virtual environment.
2. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Create `.env` in `backend/` with the following keys (example):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/totem
DEEPGRAM_API_KEY=your_deepgram_key
GEMINI_API_KEY=your_gemini_key
FRONTEND_URLS=http://localhost:3000,https://totem-beta.vercel.app
```

- **`DATABASE_URL`**: Postgres connection string.
- **`DEEPGRAM_API_KEY`**: Deepgram API key for STT.
- **`GEMINI_API_KEY`**: Google/GenAI API key used by `google-genai` client.
- **`FRONTEND_URLS`**: Comma-separated allowed origins for CORS; include your local frontend (`http://localhost:3000`).

4. Initialize DB tables (SQLAlchemy models):

```bash
cd backend
python -m app.init_db
```

Or use `schema.sql` from [BACKEND_SCHEMA.md](BACKEND_SCHEMA.md) in Supabase SQL Editor (recommended for production).

5. Run the backend server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Docker**

Build and run the backend container:

```bash
docker build -t totem-backend -f backend/Dockerfile backend
docker run -p 8000:8000 \
  -e DATABASE_URL="<your_db_url>" \
  -e DEEPGRAM_API_KEY="<key>" \
  -e GEMINI_API_KEY="<key>" \
  -e FRONTEND_URLS="https://my-frontend.example.com" \
  totem-backend
```

---

## Database (Supabase) — Setup

1. Create a Supabase project and database.
2. Enable extensions:

```sql
CREATE EXTENSION IF NOT EXISTS pgvector;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()
```

3. Create tables and views.
- Option A (recommended): Open `BACKEND_SCHEMA.md`, copy the schema SQL blocks and paste into Supabase SQL editor; run.
- Option B: Use `init_db.py` to create tables from SQLAlchemy models for local/testing usage.

4. Configure a storage bucket (optional) for audio files if you want to persist raw audio.

Notes on vector indexes:
- The repository uses `vector(384)` for embeddings. After creating the `memory_nodes` table, create an ivfflat index (adjust lists param to your data volume):

```sql
-- Example: adjust "lists" for dataset size
CREATE INDEX idx_memory_embedding ON memory_nodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## Frontend — Setup & Run

1. Install dependencies and run dev server:

```bash
cd frontend
npm install
```

Start local dev server (ensure backend is running):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

On Windows (PowerShell):

```powershell
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000"
npm run dev
```

**Config notes**
- `frontend/lib/api.ts` reads `NEXT_PUBLIC_API_URL`. Set that to your backend base URL in local `.env.local` or in your hosting provider environment settings when deploying.

---

## API Endpoints (examples)

- `POST /voice/upload` — multipart form data (`audio` file, `session_id` optional)
- `POST /intent/extract?voice_log_id=<id>` — extract intent for given voice log
- `POST /intent/confirm?intent_id=<id>` — confirm/update intent
- `POST /prompt/optimize?intent_id=<id>` — optimize confirmed intent into final prompt

Example: upload audio with curl:

```bash
curl -X POST "http://localhost:8000/voice/upload" \
  -F "audio=@/path/to/voice.webm" \
  -F "session_id=session_123"
```

Example: extract intent (after voice upload returns voice_log_id):

```bash
curl -X POST "http://localhost:8000/intent/extract?voice_log_id=<VOICE_LOG_ID>"
```

Example: optimize prompt (after intent is confirmed):

```bash
curl -X POST "http://localhost:8000/prompt/optimize?intent_id=<INTENT_ID>"
```

---

## Testing

- The `backend/` folder includes several quick test scripts referencing Deepgram and Gemini (e.g., `test_deepgram.py`). To run them, ensure environment keys are set and run:

```bash
python backend/test_deepgram.py
```

If using pytest, install `pytest` and run `pytest` from the repository root (note: tests may be scripts rather than pytest suites).

---

## Deployment Notes

- **Frontend:** Deploy to Vercel. Set `NEXT_PUBLIC_API_URL` in the Vercel environment settings. Connect the repository and use the default build command (`npm run build`) and output settings.
- **Backend:** Can be deployed via Railway, Render, or Docker container to any cloud. Ensure environment variables are configured and the database is accessible.
- **Database:** Use Supabase for a managed experience; paste SQL schema in SQL Editor and enable extensions (pgvector, pgcrypto).

---

## Troubleshooting & Tips

- If Gemini / genai returns parsing errors for structured JSON responses, increase `max_output_tokens` and ensure prompts include strict JSON schema instructions.
- If audio transcription quality is poor, verify `DEEPGRAM_API_KEY` and sample rate/encoding. Consider pre-processing audio (normalize/denoise).
- CORS issues: verify `FRONTEND_URLS` in `backend/.env` contains your frontend host (or `*` for local testing).

---

## Contribution

- Fork, create feature branches, and open pull requests. Add tests for new features and update `BACKEND_SCHEMA.md` for schema changes.

---

## License & Contact

