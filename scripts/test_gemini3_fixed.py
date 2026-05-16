import os
import time
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

client = genai.Client(api_key=API_KEY)

MODEL_NAME = "gemini-3-pro-image-preview"

def test_gen():
    print(f"Testing {MODEL_NAME} (No Config, Saving)...")
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents="A drawing of a cute robot.",
        )
        print("Response received.")
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    print("SUCCESS: Image generated!")
                    img_data = base64.b64decode(part.inline_data.data)
                    with open("test_output.png", "wb") as f:
                        f.write(img_data)
                    print(f"Saved test_output.png ({len(img_data)} bytes)")
                    return
        print("FAILED: No image.")
        print(response)
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_gen()
