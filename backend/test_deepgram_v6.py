import asyncio
import os
import deepgram
from deepgram import DeepgramClient
from dotenv import load_dotenv

load_dotenv()

async def test_deepgram_v6():
    api_key = os.getenv("DEEPGRAM_API_KEY")
    try:
        client = DeepgramClient(api_key=api_key)
        
        # Check if rest exists
        print(f"Client listen has rest: {hasattr(client.listen, 'rest')}")
        if hasattr(client.listen, 'rest'):
            print(f"Client listen rest methods: {dir(client.listen.rest)}")
            
        # Check if prerecorded exists under rest
        if hasattr(client.listen, 'rest') and hasattr(client.listen.rest, 'v'):
            v1 = client.listen.rest.v("1")
            print(f"v1 methods: {dir(v1)}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_deepgram_v6())
