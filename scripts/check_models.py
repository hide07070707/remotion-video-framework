import os
import google.genai as genai
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
client = genai.Client(api_key=API_KEY)

try:
    print("Listing models...")
    for model in client.models.list(config={'page_size': 100}):
        # Filter for models that might support generation
        if "gemini" in model.name or "imagen" in model.name:
            print(f"- {model.name} : {model.display_name}")
            # Check supported methods if possible? 
            # The client object doesn't expose methods directly on list items easily in v1.
            # But seeing the name is enough.
except Exception as e:
    print(f"Error listing models: {e}")
