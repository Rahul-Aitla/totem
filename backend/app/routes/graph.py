from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.graph_service import graph_service

router = APIRouter(prefix="/graph", tags=["graph"])

@router.get("/session/{session_id}")
async def get_session_graph(session_id: str, db: Session = Depends(get_db)):
    graph_data = graph_service.get_session_graph(db, session_id)
    return graph_data
