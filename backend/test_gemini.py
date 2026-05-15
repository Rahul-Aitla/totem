import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {'Yes' if api_key else 'No'}")

if api_key:
    client = genai.Client(api_key=api_key)
    try:
        # gemini-2.0-flash is the latest stable/flash model in the new SDK often
        # or gemini-1.5-flash
        response = client.models.generate_content(
            model="gemini-3-flash-preview", 
            contents="Hello, are you working?"
        )
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("Please set GEMINI_API_KEY in .env file")
