from google import genai
import json
from sqlalchemy.orm import Session
from app.models import MemoryNode
from app.config import settings

import uuid

class MemoryService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_id = 'gemini-3-flash-preview'
    
    def extract_and_store_memory(self, db: Session, user_session_id: str, text: str):
        """
        Extract facts from user input and store in MemoryNode.
        Checks for existing similar memories to avoid redundancy.
        """
        # First, get existing memories for this session to provide as context
        existing_memories = db.query(MemoryNode).filter(
            MemoryNode.user_session_id == user_session_id,
            MemoryNode.status == 'active'
        ).all()
        
        existing_context = ""
        if existing_memories:
            existing_context = "Existing memories for this user:\n" + \
                "\n".join([f"- ID: {m.id}, Fact: {m.fact_text}" for m in existing_memories])

        prompt = f"""
        Extract key facts, preferences, or constraints from the following text.
        Text: "{text}"
        
        {existing_context}
        
        Compare the new text with existing memories. For each new fact found:
        1. If it's completely new, mark action as "create".
        2. If it updates or contradicts an existing memory, mark action as "update" and provide the FULL EXACT ID from the list above.
        3. If it's already known, skip it.
        
        Return a JSON list of objects. Each object should have:
        - "fact_text": The extracted fact.
        - "memory_type": Category ("preference", "fact", "constraint").
        - "summary": A very short summary.
        - "action": "create" or "update".
        - "existing_id": (Optional) The FULL UUID of the memory to update.
        
        If no new or updated facts are found, return an empty list [].
        ONLY return the JSON list.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                    'temperature': 0.0
                }
            )
            content = response.text.strip()
            # Robust JSON extraction
            if "```" in content:
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            facts = json.loads(content.strip())
            
            stored_nodes = []
            for fact in facts:
                if fact.get('action') == 'update' and fact.get('existing_id'):
                    # Validate UUID before querying
                    try:
                        target_id = fact['existing_id']
                        # Ensure it's a valid UUID string
                        uuid.UUID(str(target_id))
                        
                        node = db.query(MemoryNode).filter(MemoryNode.id == target_id).first()
                        if node:
                            node.fact_text = fact.get('fact_text')
                            node.summary = fact.get('summary')
                            node.memory_type = fact.get('memory_type', node.memory_type)
                            stored_nodes.append(node)
                    except ValueError:
                        print(f"Skipping invalid UUID from Gemini: {fact['existing_id']}")
                        continue
                        
                elif fact.get('action') == 'create':
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
            db.rollback() # CRITICAL: Rollback on error to clear failed transaction state
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

    def get_memories(self, db: Session, user_session_id: str):
        """Get all active memories for a session"""
        return db.query(MemoryNode).filter(
            MemoryNode.user_session_id == user_session_id,
            MemoryNode.status == 'active'
        ).order_by(MemoryNode.created_at.desc()).all()

    def create_memory(self, db: Session, user_session_id: str, fact_text: str, memory_type: str = "general"):
        """Manually create a memory node"""
        node = MemoryNode(
            user_session_id=user_session_id,
            memory_type=memory_type,
            fact_text=fact_text,
            summary=fact_text[:50],
            status='active'
        )
        db.add(node)
        db.commit()
        db.refresh(node)
        return node

    def merge_memories(self, db: Session, primary_id: uuid.UUID, secondary_id: uuid.UUID):
        """Merge secondary memory into primary"""
        primary = db.query(MemoryNode).filter(MemoryNode.id == primary_id).first()
        secondary = db.query(MemoryNode).filter(MemoryNode.id == secondary_id).first()
        
        if not primary or not secondary:
            return None
            
        # Add secondary to primary's merge history
        merged_ids = primary.merged_from_ids or []
        if str(secondary_id) not in merged_ids:
            merged_ids.append(str(secondary_id))
            primary.merged_from_ids = merged_ids
            primary.is_merged = True
            
        # Deactivate secondary
        secondary.status = 'merged'
        
        db.commit()
        db.refresh(primary)
        return primary

memory_service = MemoryService()
