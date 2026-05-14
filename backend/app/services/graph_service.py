from sqlalchemy.orm import Session
from app.models import MemoryNode, Intent, OptimizedPrompt
import uuid

class GraphService:
    def get_session_graph(self, db: Session, user_session_id: str):
        """
        Get nodes and edges for a session's decision graph
        """
        # Retrieve memories
        memories = db.query(MemoryNode).filter(MemoryNode.user_session_id == user_session_id).all()
        
        nodes = []
        edges = []
        
        # Add memory nodes
        for m in memories:
            nodes.append({
                "id": f"mem_{m.id}",
                "label": m.fact_text[:20] + "...",
                "title": m.fact_text,
                "group": "memory"
            })
            
            # Add edges for related memories
            if m.related_memory_ids:
                for related_id in m.related_memory_ids:
                    edges.append({
                        "from": f"mem_{m.id}",
                        "to": f"mem_{related_id}",
                        "label": "related"
                    })
            
            if m.parent_memory_id:
                edges.append({
                    "from": f"mem_{m.parent_memory_id}",
                    "to": f"mem_{m.id}",
                    "label": "child"
                })
        
        return {"nodes": nodes, "edges": edges}

graph_service = GraphService()
