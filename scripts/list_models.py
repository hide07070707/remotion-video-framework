import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

client = genai.Client(api_key=API_KEY)

def list_models():
    print("Listing models...")
    try:
        # Pager object, iterate through it
        for m in client.models.list(config={"page_size": 100}):
            # Debug: print available attributes first
            # print(dir(m))
            print(f"Model: {m.name}")
            print(f"  Display Name: {m.display_name}")
            # print(f"  Methods: {m.supported_generation_methods}") # This caused error
            print("-" * 20)
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    list_models()
