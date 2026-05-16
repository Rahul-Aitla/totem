from sqlalchemy.orm import Session
from app.models import MemoryNode, Intent, OptimizedPrompt, VoiceLog
import uuid

class GraphService:
    def get_session_graph(self, db: Session, user_session_id: str):
        """
        Get nodes and edges for a session's decision graph
        """
        # Retrieve all related data
        memories = db.query(MemoryNode).filter(MemoryNode.user_session_id == user_session_id).all()
        voice_logs = db.query(VoiceLog).filter(VoiceLog.user_session_id == user_session_id).all()
        
        nodes = []
        edges = []
        
        # 1. Add Voice Log nodes
        voice_logs.sort(key=lambda x: x.created_at)
        prev_voice_id = None
        
        for v in voice_logs:
            nodes.append({
                "id": f"voice_{v.id}",
                "label": f"Audio: {v.transcribed_text[:20]}...",
                "title": v.transcribed_text,
                "group": "voice",
                "status": v.status
            })
            
            if prev_voice_id:
                edges.append({
                    "from": prev_voice_id,
                    "to": f"voice_{v.id}",
                    "label": "next"
                })
            prev_voice_id = f"voice_{v.id}"
            
            # 2. Add Intent nodes linked to Voice Logs
            intents = db.query(Intent).filter(Intent.voice_log_id == v.id).all()
            for i in intents:
                nodes.append({
                    "id": f"intent_{i.id}",
                    "label": f"Intent: {i.extracted_task[:20]}...",
                    "title": i.extracted_task,
                    "group": "intent",
                    "status": i.status
                })
                edges.append({
                    "from": f"voice_{v.id}",
                    "to": f"intent_{i.id}",
                    "label": "extracted"
                })
                
                # 3. Add Optimized Prompt nodes linked to Intents
                prompts = db.query(OptimizedPrompt).filter(OptimizedPrompt.intent_id == i.id).all()
                for p in prompts:
                    nodes.append({
                        "id": f"prompt_{p.id}",
                        "label": "Optimized Prompt",
                        "title": p.optimized_text[:100] + "...",
                        "group": "prompt",
                        "status": p.status
                    })
                    edges.append({
                        "from": f"intent_{i.id}",
                        "to": f"prompt_{p.id}",
                        "label": "optimized"
                    })

        # 4. Add memory nodes
        for m in memories:
            nodes.append({
                "id": f"mem_{m.id}",
                "label": f"Memory: {m.fact_text[:20]}...",
                "title": m.fact_text,
                "group": "memory",
                "status": m.status
            })
            
            # Link memories to session or specific voice logs if possible
            # For now, let's just keep them as separate nodes unless they have relations
            
            if m.parent_memory_id:
                edges.append({
                    "from": f"mem_{m.parent_memory_id}",
                    "to": f"mem_{m.id}",
                    "label": "child"
                })
            
            if m.related_memory_ids:
                for related_id in m.related_memory_ids:
                    edges.append({
                        "from": f"mem_{m.id}",
                        "to": f"mem_{related_id}",
                        "label": "related"
                    })
        
        return {"nodes": nodes, "edges": edges}

graph_service = GraphService()
