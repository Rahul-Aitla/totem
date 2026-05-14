import google.generativeai as genai
import json
import os
from app.config import settings

class IntentDetector:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-flash-latest')
    
    def extract_intent(self, text: str):
        """
        Extract intent from text using Gemini
        Returns: {task, format, domain, constraints, confidence}
        """
        prompt = f"""
        Extract the user's intent from the following text (which may be in English, Hindi, or Hinglish).
        Text: "{text}"
        
        Return a JSON object with:
        - task: The main action requested (e.g., "Create a marketing plan", "Write a blog post").
        - format: Preferred output format (e.g., "bullet_points", "paragraph", "code").
        - domain: The subject area (e.g., "marketing", "technical", "creative").
        - constraints: A JSON object with any specific constraints (e.g., {{"max_words": 100, "tone": "professional"}}).
        - confidence: A score from 0.0 to 1.0 based on how clear the intent is.
        
        ONLY return the JSON object.
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Clean response text from potential markdown blocks
            content = response.text.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            
            data = json.loads(content.strip())
            return data
        except Exception as e:
            print(f"Intent Extraction Error: {e}")
            return {
                "task": "General task",
                "format": "paragraph",
                "domain": "general",
                "constraints": {},
                "confidence": 0.5,
                "error": str(e)
            }

intent_detector = IntentDetector()
