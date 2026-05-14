from deepgram import DeepgramClient
import os
from app.config import settings

class DeepgramSTTService:
    def __init__(self):
        self.client = DeepgramClient(api_key=settings.DEEPGRAM_API_KEY)
    
    async def transcribe(self, audio_file_path: str):
        """
        Transcribe audio using Deepgram
        Returns: {text, language, confidence}
        """
        try:
            with open(audio_file_path, 'rb') as f:
                buffer_data = f.read()
            
            # Using the v6 SDK pattern
            response = self.client.listen.v1.media.transcribe_file(
                request=buffer_data,
                model="nova-2",
                smart_format=True,
                language="hi",  # Hindi/Hinglish support
                punctuate=True,
                diarize=False,
            )
            
            # Navigate the response structure (Deepgram v6 responses are Pydantic models)
            if not response.results or not response.results.channels:
                return {"error": "No transcription results"}
                
            alternative = response.results.channels[0].alternatives[0]
            transcript = alternative.transcript
            confidence = alternative.confidence
            
            return {
                "text": transcript,
                "language": "hinglish", # Defaulting as per PRD
                "confidence": confidence
            }
        except Exception as e:
            print(f"STT Error: {e}")
            return {"error": str(e)}

stt_service = DeepgramSTTService()
