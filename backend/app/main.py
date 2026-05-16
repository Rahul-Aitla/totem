from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import voice, intent, prompt, memory, graph, logs, session

app = FastAPI(title="TOTEM - Voice Prompt Engine")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
