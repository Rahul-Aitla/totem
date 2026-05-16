from app.config import settings
from app.routes import graph, intent, logs, memory, prompt, session, voice
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TOTEM - Voice Prompt Engine")

allowed_origins = [
    origin.strip() for origin in settings.FRONTEND_URLS.split(",") if origin.strip()
]
production_frontend_origin = "https://totem-beta.vercel.app"
if production_frontend_origin not in allowed_origins:
    allowed_origins.append(production_frontend_origin)
if not allowed_origins:
    allowed_origins = ["*"]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials="*" not in allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Export for Vercel
app = app


@app.get("/")
async def root():
    return {"message": "Welcome to TOTEM API"}


# Include routers
app.include_router(voice.router)
app.include_router(intent.router)
app.include_router(prompt.router)
app.include_router(memory.router)
app.include_router(graph.router)
app.include_router(logs.router)
app.include_router(session.router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
