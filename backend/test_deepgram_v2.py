import asyncio
import os
import deepgram
from dotenv import load_dotenv

load_dotenv()

async def test_deepgram():
    api_key = os.getenv("DEEPGRAM_API_KEY")
    try:
        from deepgram import DeepgramClient
        client = DeepgramClient(api_key=api_key)
        print(f"Listen v1 media methods: {[m for m in dir(client.listen.v1.media) if not m.startswith('_')]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_deepgram())
