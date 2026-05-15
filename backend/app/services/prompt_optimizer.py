from google import genai
from google.genai import types
import os
import json
from app.config import settings

class PromptOptimizer:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_id = 'gemini-3-flash-preview'
    
    def optimize(self, intent: dict, original_text: str, context: str = ""):
        """
        Optimize intent into minimum viable prompt
        Temperature=0 for deterministic output
        """
        context_section = f"\nContext from previous interactions:\n{context}" if context else ""
        
        # Use json.dumps to safely embed data in the prompt
        intent_json = json.dumps(intent, indent=2)
        
        system_prompt = f"""
        You are an expert prompt engineer. Your task is to transform raw user input into a clean, minimal, token-efficient prompt.
        {context_section}
        
        Input intent (JSON):
        {intent_json}
        
        Original raw input: "{original_text}"
        
        Your goal is to produce a "Minimum Viable Prompt" (MVP) that captures all requirements but uses as few tokens as possible.
        
        You MUST return a valid JSON object with EXACTLY these keys:
        - "optimized_text": The final optimized prompt string.
        - "reasoning": A brief string explaining your optimization choices.
        - "token_reduction_estimate": A number (float) representing percentage reduction (e.g. 45.5).
        
        CRITICAL: Ensure the JSON is complete and valid. Do not cut off the response.
        """
        
        try:
            # Use a slightly more stable configuration for JSON
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=system_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.0,
                    max_output_tokens=2048, # Increased to prevent truncation
                    response_mime_type='application/json'
                )
            )
            
            if not response.text:
                raise ValueError("Empty response from Gemini")

            # More robust JSON extraction
            content = response.text.strip()
            # Remove markdown code blocks if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            # Try to fix common truncation issue: if it doesn't end with }, try to add it
            # But here the error was an unterminated string, which is harder to fix.
            # Increasing max_output_tokens and improving prompt should prevent it.
            
            data = json.loads(content.strip())
            return {
                "optimized_text": data.get('optimized_text', ''),
                "reasoning": data.get('reasoning', ''),
                "reduction_percentage": data.get('token_reduction_estimate', 0),
                "status": "success"
            }
        except Exception as e:
            print(f"Optimization Error: {e}")
            print(f"Raw Response Content: {response.text if 'response' in locals() else 'No response'}")
            return {
                "error": str(e),
                "status": "failed"
            }
    
    def count_tokens(self, text: str):
        """Count tokens in text using Gemini tokenizer"""
        try:
            # Using the new SDK's count_tokens method
            response = self.client.models.count_tokens(
                model=self.model_id,
                contents=text
            )
            return response.total_tokens
        except Exception as e:
            print(f"Token Counting Error: {e}")
            # Fallback: rough estimate (1 token ≈ 4 chars)
            return len(text) // 4

prompt_optimizer = PromptOptimizer()
