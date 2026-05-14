from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.memory_service import memory_service
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/memory", tags=["memory"])

class MemoryCreate(BaseModel):
    user_session_id: str
    fact_text: str
    memory_type: str = "general"

@router.post("/create")
async def create_memory(data: MemoryCreate, db: Session = Depends(get_db)):
    memory = memory_service.create_memory(db, data.user_session_id, data.fact_text, data.memory_type)
    return memory

@router.get("/list/{session_id}")
async def list_memories(session_id: str, db: Session = Depends(get_db)):
    memories = memory_service.get_memories(db, session_id)
    return memories

@router.patch("/merge")
async def merge_memories(primary_id: str, secondary_id: str, db: Session = Depends(get_db)):
    try:
        p_uuid = uuid.UUID(primary_id)
        s_uuid = uuid.UUID(secondary_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
        
    result = memory_service.merge_memories(db, p_uuid, s_uuid)
    if not result:
        raise HTTPException(status_code=404, detail="One or both memories not found")
    return result
