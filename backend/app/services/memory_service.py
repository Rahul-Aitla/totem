from google import genai
import json
from sqlalchemy.orm import Session
from app.models import MemoryNode
from app.config import settings

class MemoryService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_id = 'gemini-3-flash-preview'
    
    def extract_and_store_memory(self, db: Session, user_session_id: str, text: str):
        """
        Extract facts from user input and store in MemoryNode
        """
        prompt = f"""
        Extract key facts or preferences from the following text that might be useful for future interactions.
        Text: "{text}"
        
        Return a JSON list of facts. Each fact should have:
        - fact_text: The extracted fact (e.g., "User prefers short bullet points").
        - memory_type: Category (e.g., "preference", "fact", "constraint").
        - summary: A very short summary of the fact.
        
        If no facts are found, return an empty list [].
        ONLY return the JSON list.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt
            )
            content = response.text.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            
            facts = json.loads(content.strip())
            
            stored_nodes = []
            for fact in facts:
                node = MemoryNode(
                    user_session_id=user_session_id,
                    memory_type=fact.get('memory_type', 'general'),
                    fact_text=fact.get('fact_text'),
                    summary=fact.get('summary'),
                    status='active'
                )
                db.add(node)
                stored_nodes.append(node)
            
            db.commit()
            return stored_nodes
        except Exception as e:
            print(f"Memory Extraction Error: {e}")
            return []

    def get_relevant_context(self, db: Session, user_session_id: str, limit: int = 5):
        """
        Retrieve relevant context for the current session
        (Simplified: just get the latest memories for now)
        """
        memories = db.query(MemoryNode).filter(
            MemoryNode.user_session_id == user_session_id,
            MemoryNode.status == 'active'
        ).order_by(MemoryNode.created_at.desc()).limit(limit).all()
        
        context_str = "\n".join([f"- {m.fact_text}" for m in memories])
        return context_str

memory_service = MemoryService()
