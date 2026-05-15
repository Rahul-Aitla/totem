import asyncio
import os
from deepgram import DeepgramClient, PrerecordedOptions, FileSource
from dotenv import load_dotenv

load_dotenv()

async def test_deepgram():
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        print("Please set DEEPGRAM_API_KEY in .env file")
        return

    client = DeepgramClient(api_key)
    
    # Create a dummy small wav file or use an existing one if available
    # For testing connectivity, we can try to call a method that doesn't require a real file first
    # but listen.v1.media.transcribe_file is the main one.
    
    print(f"Deepgram Client initialized with key: {api_key[:5]}...")
    
    try:
        # Just check if we can list models or something similar to verify key
        # Actually, let's just try to see if the client structure matches what I wrote
        print("Checking client structure...")
        print(f"Client listen: {hasattr(client, 'listen')}")
        if hasattr(client, 'listen'):
            print(f"Client listen v1: {hasattr(client.listen, 'v1')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_deepgram())
