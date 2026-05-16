import os
import time
import json
import base64
import requests
from google import genai
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
OUTPUT_BASE_DIR = r'video/public/assets'

# Job Name needs to be input or retrieved (simplest is to list latest)
# For this script, we'll list the latest job or take an arg.
def retrieve_batch():
    client = genai.Client(api_key=API_KEY)
    
    print("Checking for recent batch jobs...")
    try:
        # List jobs
        jobs = list(client.batches.list(limit=1))
        if not jobs:
            print("No batch jobs found.")
            return

        latest_job = jobs[0]
        print(f"Latest Job: {latest_job.name}")
        print(f"Status: {latest_job.state}")

        if latest_job.state == "SUCCEEDED":
            print("Job Succeeded! Downloading results...")
            
            # Helper to get output file content
            # The SDK might provide a direct way, or we download the output_file string (URI)
            # Typically: client.files.content(latest_job.output_file.name)
            
            output_file_name = latest_job.output_file
            # Resolve file content
            # Note: Checking SDK method for file content
            # Assuming client.files.download or similar or http get on uri (if signed)
            
            # Using client.files.content which returns bytes or string
            content = client.files.content(name=output_file_name) 
            # Parse JSONL results
            # Each line is a result
            
            lines = content.strip().split(b'\n')
            print(f"Downloaded {len(lines)} results.")

            for line in lines:
                result = json.loads(line)
                custom_id = result.get('custom_id')
                # Parse response
                # response -> body -> candidates -> content -> parts -> inline_data
                
                try:
                    # Construct Output Path
                    # chX_scYY
                    import re
                    match = re.search(r'ch(\d+)_sc(\d+)', custom_id)
                    if match:
                        ch = match.group(1)
                        sc_id = custom_id
                        
                        chapter_dir = os.path.join(OUTPUT_BASE_DIR, f"chapter{ch}")
                        os.makedirs(chapter_dir, exist_ok=True)
                        out_path = os.path.join(chapter_dir, f"{sc_id}.png")
                        
                        # Find image data
                        response_part = result.get('response', {}).get('body', {})
                        # This structure depends on the API version, usually mirrors generateContent response
                        candidates = response_part.get('candidates', [])
                        if candidates:
                            parts = candidates[0].get('content', {}).get('parts', [])
                            for part in parts:
                                if 'inlineData' in part or 'inline_data' in part:
                                    # Handle snake_case or camelCase
                                    blob = part.get('inlineData') or part.get('inline_data')
                                    data_b64 = blob.get('data')
                                    
                                    with open(out_path, 'wb') as f:
                                        f.write(base64.b64decode(data_b64))
                                    print(f"Saved {sc_id}")
                                    break
                except Exception as e_inner:
                    print(f"Error processing {custom_id}: {e_inner}")

        elif latest_job.state == "FAILED":
             print(f"Job Failed: {latest_job.error}")
        else:
            print(f"Job in progress: {latest_job.state}. Retry later.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    retrieve_batch()
