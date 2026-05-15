from google import genai
import json
import os
from app.config import settings

class IntentDetector:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_id = 'gemini-3-flash-preview'
    
    def extract_intent(self, text: str, context: str = ""):
        """
        Extract intent from text using Gemini.
        Handles English, Hindi, and Hinglish.
        Returns: {task, format, domain, constraints, confidence}
        """
        context_section = f"\nRelevant memory context:\n{context}" if context else ""
        
        prompt = f"""
        Extract the user's intent from the following text. 
        The text may be in English, Hindi, or Hinglish (Hindi written in Roman script or mixed with English).
        {context_section}
        
        Text: "{text}"
        
        You MUST return a JSON object with EXACTLY these keys:
        - "task": A clear, concise description of the main action requested.
        - "format": The requested output format (e.g., "bullet_points", "email", "code", "summary"). Default to "paragraph" if not specified.
        - "domain": The context/subject area (e.g., "marketing", "technical", "personal", "finance").
        - "constraints": A JSON object containing specific rules (e.g., {{"max_words": 50, "tone": "formal", "language": "Hindi"}}).
        - "confidence": A number between 0.0 and 1.0 reflecting how sure you are of this extraction.
        - "language_detected": The language used in the input (English, Hindi, or Hinglish).
        
        Guidelines:
        - If the user says "Bhai ek email likh de marketing ke liye", task is "Write a marketing email", domain is "marketing", format is "email", language_detected is "Hinglish".
        - Be precise about constraints.
        
        CRITICAL: Ensure the JSON is valid and complete.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config={
                    'temperature': 0.0,
                    'max_output_tokens': 1024,
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
