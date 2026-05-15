import asyncio
import os
import deepgram
from deepgram import DeepgramClient
from dotenv import load_dotenv

load_dotenv()

async def test_deepgram_v7():
    api_key = os.getenv("DEEPGRAM_API_KEY")
    try:
        client = DeepgramClient(api_key=api_key)
        
        dummy_file = "dummy.wav"
        with open(dummy_file, "wb") as f:
            f.write(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x44\xac\x00\x00\x01\x00\x08\x00data\x00\x00\x00\x00")
        
        with open(dummy_file, 'rb') as f:
            buffer_data = f.read()
        
        print("Testing with only request=buffer_data...")
        try:
            response = client.listen.v1.media.transcribe_file(request=buffer_data)
            print(f"Success! Response type: {type(response)}")
        except Exception as e:
            print(f"Failed: {e}")
            
        os.remove(dummy_file)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_deepgram_v7())
