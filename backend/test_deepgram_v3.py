import asyncio
import os
import deepgram
from deepgram import DeepgramClient, PrerecordedOptions, FileSource
from dotenv import load_dotenv

load_dotenv()

async def test_deepgram_v3():
    api_key = os.getenv("DEEPGRAM_API_KEY")
    try:
        client = DeepgramClient(api_key=api_key)
        
        # Check what the expected payload is
        # Creating a tiny dummy file
        dummy_file = "dummy.wav"
        with open(dummy_file, "wb") as f:
            f.write(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x44\xac\x00\x00\x01\x00\x08\x00data\x00\x00\x00\x00")
        
        with open(dummy_file, 'rb') as f:
            buffer_data = f.read()
        
        payload: FileSource = {"buffer": buffer_data}
        options: PrerecordedOptions = PrerecordedOptions(
            model="nova-2",
            smart_format=True,
            language="hi",
        )
        
        print("Attempting call with named arguments...")
        try:
            # Try named arguments which is usually safer for SDKs with multiple positional arg confusion
            response = client.listen.v1.media.transcribe_file(
                source=payload,
                options=options
            )
            print("Success with named args")
        except Exception as e1:
            print(f"Failed with named args: {e1}")
            
            print("Attempting call with direct positional arguments...")
            try:
                response = client.listen.v1.media.transcribe_file(payload, options)
                print("Success with positional args")
            except Exception as e2:
                print(f"Failed with positional args: {e2}")

        os.remove(dummy_file)
    except Exception as e:
        print(f"Setup error: {e}")

if __name__ == "__main__":
    asyncio.run(test_deepgram_v3())
