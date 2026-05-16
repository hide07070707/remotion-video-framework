import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

client = genai.Client(api_key=API_KEY)

def test_model(model_name, method):
    print(f"Testing {model_name} with {method}...")
    try:
        if method == 'generate_images':
            response = client.models.generate_images(
                model=model_name,
                prompt="A cute cat",
                config=types.GenerateImagesConfig(number_of_images=1)
            )
            print(f"  SUCCESS: {model_name} (generate_images)")
            return True
        elif method == 'generate_content':
            response = client.models.generate_content(
                model=model_name,
                contents="Draw a cute cat",
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"]
                )
            )
            print(f"  SUCCESS: {model_name} (generate_content)")
            return True
    except Exception as e:
        print(f"  FAILED: {model_name} ({method}) - {e}")
        return False

models_to_test = [
    "models/gemini-2.0-flash-exp",
    "models/gemini-1.5-pro",
    "models/gemini-2.5-flash-native-audio-preview" # Maybe this one?
]

for m in models_to_test:
    test_model(m, 'generate_images')
    test_model(m, 'generate_content')
