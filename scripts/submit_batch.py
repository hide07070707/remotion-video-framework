import os
import time
from google.genai import types
from google import genai
from dotenv import load_dotenv
import traceback

load_dotenv()

API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
JSONL_PATH = r'video/batch_requests.jsonl'

# Explicitly set the model ID we are testing
MODEL_ID = "models/gemini-2.0-flash-exp"
# MODEL_ID = "models/gemini-1.5-flash" # Fallback

def submit_batch():
    if not API_KEY:
        print("API Key missing.")
        return

    client = genai.Client(api_key=API_KEY)

    print(f"Uploading {JSONL_PATH}...")
    try:
        # Upload file for batch
        # Using the files API with mime_type
        file_ref = client.files.upload(file=JSONL_PATH, config={'mime_type': 'application/json'})
        print(f"File uploaded: {file_ref.name} (URI: {file_ref.uri})")
        
        # Wait for file to establish
        time.sleep(5)

        print(f"Submitting Batch Job with model: {MODEL_ID}...")
        
        # Batch creation
        batch_job = client.batches.create(
            model=MODEL_ID,
            src=file_ref.name,
            config=types.CreateBatchJobConfig(
                display_name="Production_Images_217"
            )
        )
        
        print(f"Batch Job Submitted Successfully!")
        print(f"Job Name (ID): {batch_job.name}")
        print(f"State: {batch_job.state}")

    except Exception as e:
        traceback.print_exc()
        print(f"Error submitting batch: {e}")

if __name__ == "__main__":
    submit_batch()
