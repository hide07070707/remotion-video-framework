import os
import time
from google.genai import types
from google import genai
from dotenv import load_dotenv
import traceback

load_dotenv()

API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
JSONL_PATH = r'video/batch_ch1.jsonl'
MODEL_ID = "models/gemini-2.0-flash-exp" # Nano Banana Pro

def submit_batch():
    if not API_KEY:
        print("API Key missing.")
        return

    client = genai.Client(api_key=API_KEY)

    print(f"Uploading {JSONL_PATH}...")
    try:
        # Upload file for batch
        file_ref = client.files.upload(file=JSONL_PATH, config={'mime_type': 'application/json'})
        print(f"File uploaded: {file_ref.name} (URI: {file_ref.uri})")
        
        # Wait for file to become active
        print("Waiting for file to be processed...")
        while True:
            file_status = client.files.get(name=file_ref.name)
            if file_status.state.name == "ACTIVE":
                print("File is ACTIVE.")
                break
            elif file_status.state.name == "FAILED":
                print("File processing FAILED.")
                return
            time.sleep(2)

        print(f"Submitting Batch Job for Chapter 1 with model: {MODEL_ID}...")
        
        batch_job = client.batches.create(
            model=MODEL_ID,
            src=file_ref.name,
            config=types.CreateBatchJobConfig(
                display_name="Chapter1_Images_49"
            )
        )
        
        print(f"Batch Job Submitted Successfully!")
        print(f"Job Name (ID): {batch_job.name}")
        print(f"State: {batch_job.state}")
        print(f"To check status, use: python video/scripts/check_batch_status.py {batch_job.name}")

    except Exception as e:
        traceback.print_exc()
        print(f"Error submitting batch: {e}")

if __name__ == "__main__":
    submit_batch()
