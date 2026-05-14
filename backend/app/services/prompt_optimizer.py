import google.generativeai as genai
import os
from app.config import settings

class PromptOptimizer:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-flash-latest')
    
    def optimize(self, intent: dict, original_text: str, context: str = ""):
        """
        Optimize intent into minimum viable prompt
        Temperature=0 for deterministic output
        """
        context_section = f"\nContext from previous interactions:\n{context}" if context else ""
        
        system_prompt = f"""
        You are an expert prompt engineer. Your task is to transform raw user input into a clean, minimal, token-efficient prompt.
        {context_section}
        
        Input intent:
        - Task: {intent['task']}
        - Format: {intent['format']}
        - Domain: {intent['domain']}
        - Constraints: {intent['constraints']}
        
        Original raw input: "{original_text}"
        
        Your goal is to produce a "Minimum Viable Prompt" (MVP) that captures all requirements but uses as few tokens as possible.
        Return a JSON object with:
        - optimized_text: The final optimized prompt.
        - reasoning: Brief explanation of optimization choices.
        - token_reduction_estimate: Percentage reduction in tokens compared to original raw input.
        
        ONLY return the JSON object.
        """
        
        try:
            response = self.model.generate_content(
                system_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.0,
                    max_output_tokens=512
                )
            )
            
            optimized_text = response.text.strip()
            
            return {
                "optimized_text": optimized_text,
                "status": "success"
            }
        except Exception as e:
            print(f"Optimization Error: {e}")
            return {
                "error": str(e),
                "status": "failed"
            }
    
    def count_tokens(self, text: str):
        """Count tokens in text using Gemini tokenizer"""
        try:
            # Note: Gemini 1.5 doesn't have a direct local token counter in the current SDK easily accessible like this
            # but we can use the count_tokens method of the model
            response = self.model.count_tokens(text)
            return response.total_tokens
        except Exception as e:
            print(f"Token Counting Error: {e}")
            # Fallback: rough estimate (1 token ≈ 4 chars)
            return len(text) // 4

prompt_optimizer = PromptOptimizer()
