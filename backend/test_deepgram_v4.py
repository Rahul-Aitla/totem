import asyncio
import os
import deepgram
from deepgram import DeepgramClient
from dotenv import load_dotenv

load_dotenv()

async def test_deepgram_v4():
    api_key = os.getenv("DEEPGRAM_API_KEY")
    try:
        client = DeepgramClient(api_key=api_key)
        
        dummy_file = "dummy.wav"
        with open(dummy_file, "wb") as f:
            f.write(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x44\xac\x00\x00\x01\x00\x08\x00data\x00\x00\x00\x00")
        
        with open(dummy_file, 'rb') as f:
            buffer_data = f.read()
        
        payload = {"buffer": buffer_data}
        options = {
            "model": "nova-2",
            "smart_format": True,
            "language": "hi",
        }
        
        print("Testing positional arguments (v1, options)...")
        try:
            # The error "takes 1 positional argument but 3 were given" usually implies
            # self (1) + payload (2) + options (3) = 3 total.
            # If it only takes 1 (self), then it wants keyword arguments only or a single object.
            response = client.listen.v1.media.transcribe_file(payload, options)
            print("Success positional")
        except Exception as e:
            print(f"Failed positional: {e}")
            
            print("Testing keyword arguments (source=payload, options=options)...")
            try:
                response = client.listen.v1.media.transcribe_file(source=payload, options=options)
                print("Success keyword")
            except Exception as e2:
                print(f"Failed keyword: {e2}")

        os.remove(dummy_file)
    except Exception as e:
        print(f"Setup error: {e}")

if __name__ == "__main__":
    asyncio.run(test_deepgram_v4())
