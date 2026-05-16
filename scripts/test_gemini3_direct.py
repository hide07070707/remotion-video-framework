import os
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemini-3-pro-image-preview"

def test_gen():
    print(f"Testing {MODEL_NAME} (Direct Save)...")
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents="A drawing of a cute robot.",
        )
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    print("Found inline_data.")
                    data_obj = part.inline_data.data
                    print(f"Type of data: {type(data_obj)}")
                    
                    # Try saving directly
                    try:
                        with open("test_output_direct.png", "wb") as f:
                            if isinstance(data_obj, str):
                                f.write(base64.b64decode(data_obj))
                            else:
                                f.write(data_obj)
                        print("Saved test_output_direct.png")
                    except Exception as e:
                        print(f"Error saving: {e}")
                        
                    return
        print("FAILED: No image.")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_gen()
