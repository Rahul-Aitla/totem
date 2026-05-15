from google import genai
import json
import os
from app.config import settings

class IntentDetector:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_id = 'gemini-3-flash-preview'
    
    def extract_intent(self, text: str):
        """
        Extract intent from text using Gemini
        Returns: {task, format, domain, constraints, confidence}
        """
        prompt = f"""
        Extract the user's intent from the following text (which may be in English, Hindi, or Hinglish).
        Text: "{text}"
        
        You MUST return a JSON object with EXACTLY these keys:
        - "task": The main action requested string.
        - "format": Preferred output format string (e.g., "bullet_points", "paragraph", "code").
        - "domain": The subject area string (e.g., "marketing", "technical", "creative").
        - "constraints": A JSON object with any specific constraints (e.g., {{"max_words": 100, "tone": "professional"}}).
        - "confidence": A number (float) from 0.0 to 1.0.
        
        CRITICAL: Ensure the JSON is complete and valid. Do not cut off the response.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config={
                    'temperature': 0.0,
                    'max_output_tokens': 2048,
                    'response_mime_type': 'application/json',
                }
            )
            
            if not response.text:
                raise ValueError("Empty response from Gemini")

            # More robust JSON extraction
            content = response.text.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            data = json.loads(content.strip())
            return data
        except Exception as e:
            print(f"Intent Extraction Error: {e}")
            print(f"Raw Response Content: {response.text if 'response' in locals() else 'No response'}")
            return {
                "task": "General task",
                "format": "paragraph",
                "domain": "general",
                "constraints": {},
                "confidence": 0.5,
                "error": str(e)
            }

intent_detector = IntentDetector()
