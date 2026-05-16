import os
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

client = genai.Client(api_key=API_KEY)

MODEL_NAME = "gemini-3-pro-image-preview"

def test_gen():
    print(f"Testing {MODEL_NAME}...")
    try:
        response = client.models.generate_images(
            model=MODEL_NAME,
            prompt="A drawing of a cute robot.",
            config=types.GenerateImagesConfig(
                number_of_images=1,
            )
        )
        print("Response received.")
        if response.generated_images:
            img = response.generated_images[0]
            if img.image:
                print("SUCCESS: Image generated.")
                # Optional: save to check
                # with open("test_nanobanana.png", "wb") as f:
                #     f.write(img.image.image_bytes)
                return
        print("FAILED: No image.")
        print(response)
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_gen()
