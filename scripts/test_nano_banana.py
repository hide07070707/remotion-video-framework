import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

client = genai.Client(api_key=API_KEY)

MODEL_NAME = "models/gemini-2.0-flash-exp"

def test_nano_banana():
    print(f"Testing {MODEL_NAME} for Image Generation (MIME: image/png)...")
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents="A drawing of a banana.",
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                response_mime_type="image/jpeg" 
            )
        )
        print("Response received.")
        # Check parts
        if response.candidates and response.candidates[0].content.parts:
            print("Parts found.")
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    print("SUCCESS: Inline Image Data found!")
                    return
        print("FAILED: No image data in response.")
        print(response)
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_nano_banana()
