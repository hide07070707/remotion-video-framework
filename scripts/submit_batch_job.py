import os
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Configuration
INPUT_FILE_PATH = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\batch_requests_217.jsonl'
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT")

def submit_batch_job():
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        return

    client = genai.Client(api_key=api_key)

    try:
        # 1. Upload the file
        print(f"Uploading {INPUT_FILE_PATH}...")
        
        # Note: 'google-genai' SDK syntax might differ. 
        # Using standard 'files.upload' if supported, or looking for specific batch upload methods.
        # Based on search results, we upload the file first.
        # Specify mime_type for jsonl
        batch_file = client.files.upload(file=INPUT_FILE_PATH, config={'mime_type': 'application/json'})
        print(f"File uploaded: {batch_file.name}")
        
        # Wait for file to be active (though usually instant for small files)
        while batch_file.state == "PROCESSING":
            print("Waiting for file processing...")
            time.sleep(1)
            batch_file = client.files.get(name=batch_file.name)

        if batch_file.state != "ACTIVE":
             print(f"File upload failed with state: {batch_file.state}")
             return

        # 2. Create the batch job
        print("Creating batch job...")
        
        # The syntax for creating a batch job in the new SDK:
        # job = client.batches.create(
        #   model="...",
        #   src=...,
        #   dest=... 
        # )
        
        job = client.batches.create(
            model="gemini-3-pro-image-preview",
            src=batch_file.name,
        )

        print(f"\nBatch Job Created Successfully!")
        print(f"Job ID: {job.name}")
        print(f"Status: {job.state}")
        print(f"To check status later: client.batches.get(name='{job.name}')")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    submit_batch_job()

