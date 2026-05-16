import os
import json
import time
import base64
import concurrent.futures
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemini-3-pro-image-preview"

INPUT_JSONL = r'video/batch_ch1.jsonl'
OUTPUT_BASE_DIR = r'video/public/assets'
MASTER_IMAGE_PATH = r'video/public/assets/characters/yoko_master.png'

# Force overwrite to ensure new images use the master reference
FORCE_OVERWRITE = True

def upload_master_image():
    if not os.path.exists(MASTER_IMAGE_PATH):
        print(f"Master image not found at {MASTER_IMAGE_PATH}")
        return None
    
    print(f"Uploading master image: {MASTER_IMAGE_PATH}")
    try:
        # Fixed: use 'file' argument instead of 'path'
        file_ref = client.files.upload(file=MASTER_IMAGE_PATH, config={'mime_type': 'image/png'})
        print(f"Master image uploaded: {file_ref.name} (URI: {file_ref.uri})")
        
        # Wait for processing
        print("Waiting for master image to be ACTIVE...")
        start_time = time.time()
        while True:
             f = client.files.get(name=file_ref.name)
             if f.state.name == "ACTIVE":
                 print("Master image is ACTIVE.")
                 break
             elif f.state.name == "FAILED":
                 print("Master image processing FAILED.")
                 return None
             
             if time.time() - start_time > 60:
                 print("Timeout waiting for master image.")
                 return None
                 
             time.sleep(2)
             
        return file_ref.uri
    except Exception as e:
        print(f"Error uploading master image: {e}")
        return None


def generate_single_image(request_data, master_uri):
    custom_id = request_data.get('custom_id')
    print(f"Starting {custom_id}...")
    
    # Parse ID locally to determine output path
    match = re.search(r'ch(\d+)_sc(\d+)', custom_id)
    if not match:
        print(f"Skipping invalid ID: {custom_id}")
        return
    
    ch_num = match.group(1)
    
    chapter_dir = os.path.join(OUTPUT_BASE_DIR, f"chapter{ch_num}")
    os.makedirs(chapter_dir, exist_ok=True)
    output_path = os.path.join(chapter_dir, f"{custom_id}.png")
    
    # Check overwrite policy
    if not FORCE_OVERWRITE and os.path.exists(output_path):
        if os.path.getsize(output_path) > 1000:
            print(f"Skipping {custom_id} (Exists & Valid)")
            return
    
    # Extract prompt
    try:
        prompt_text = request_data['body']['contents']['parts'][0]['text']
        
        # Construct content parts
        parts = [types.Part.from_text(text=prompt_text)]
        
        # Add master image if available
        if master_uri:
             parts.append(
                 types.Part.from_uri(
                     file_uri=master_uri,
                     mime_type="image/png"
                 )
             )

        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=[types.Content(role="user", parts=parts)],
                )
                
                if response.candidates and response.candidates[0].content.parts:
                    for part in response.candidates[0].content.parts:
                        if part.inline_data:
                            img_data = part.inline_data.data
                            if isinstance(img_data, str):
                                img_data = base64.b64decode(img_data)
                                
                            with open(output_path, "wb") as f:
                                f.write(img_data)
                            print(f"SUCCESS: Saved {custom_id} ({len(img_data)} bytes)")
                            return
                
                print(f"  Failed {custom_id}: No image data.")
                
            except Exception as e:
                print(f"  Error {custom_id} (Attempt {attempt+1}): {e}")
                time.sleep(2)
            
            time.sleep(1) 
            
    except Exception as e:
        print(f"Critical error for {custom_id}: {e}")

def main():
    if not os.path.exists(INPUT_JSONL):
        print("Input file not found.")
        return

    requests = []
    with open(INPUT_JSONL, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                requests.append(json.loads(line))
    
    print(f"Loaded {len(requests)} requests.")
    
    # Upload Data
    master_uri = upload_master_image()
    if master_uri:
        print("Using Master Image Reference.")
    else:
        print("WARNING: Proceeding WITHOUT Master Image Reference.")

    # Run in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(generate_single_image, req, master_uri): req['custom_id'] for req in requests}
        
        for future in concurrent.futures.as_completed(futures):
            cid = futures[future]
            try:
                future.result()
            except Exception as e:
                print(f"Exception in worker for {cid}: {e}")

if __name__ == "__main__":
    main()
