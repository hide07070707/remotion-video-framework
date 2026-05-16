import os
import json
import re
import time
import base64
import google.genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
INPUT_JSONL = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\batch_requests_217.jsonl'
OUTPUT_BASE_DIR = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets'

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def generate_images_sequential():
    if not API_KEY:
        print("Error: API Key not found.")
        return

    client = google.genai.Client(api_key=API_KEY)

    # Read requests
    requests = []
    if os.path.exists(INPUT_JSONL):
        with open(INPUT_JSONL, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    requests.append(json.loads(line))
    else:
        print(f"Error: {INPUT_JSONL} not found.")
        return

    print(f"Loaded {len(requests)} requests.")

    for i, req in enumerate(requests):
        custom_id = req.get('custom_id', 'unknown')
        # custom_id format: ### chX_scYY
        # We need to parse chapter and scene
        match = re.search(r'ch(\d+)_sc(\d+)', custom_id)
        if not match:
            print(f"Skipping invalid ID: {custom_id}")
            continue

        ch_num = match.group(1)
        sc_num_str = match.group(2) # Keep string for filename 01, 02...
        
        # Output Path
        chapter_dir = os.path.join(OUTPUT_BASE_DIR, f"chapter{ch_num}")
        ensure_dir(chapter_dir)
        output_path = os.path.join(chapter_dir, f"ch{ch_num}_sc{sc_num_str}.png")

        if os.path.exists(output_path):
            print(f"[{i+1}/{len(requests)}] Skipping {custom_id} (Exists)")
            continue

        print(f"[{i+1}/{len(requests)}] Generating {custom_id}...")

        # Extract prompt from request body
        # body -> contents -> parts -> [0] -> text
        try:
            raw_prompt = req['body']['contents']['parts'][0]['text']
            
            # Parse --cref URI
            cref_uri = None
            clean_prompt = raw_prompt
            cref_match = re.search(r'--cref\s+(https?://[^\s]+)', raw_prompt)
            if cref_match:
                cref_uri = cref_match.group(1)
                clean_prompt = raw_prompt.replace(cref_match.group(0), "").strip()
                # Remove --cw if present
                clean_prompt = re.sub(r'--cw\s+\d+', '', clean_prompt).strip()

            # Construct Parts
            parts = [types.Part.from_text(text=clean_prompt)]
            
            if cref_uri:
                print(f"  - Attaching Reference: {cref_uri}")
                parts.append(
                    types.Part(
                        file_data=types.FileData(
                            file_uri=cref_uri,
                            mime_type="image/png"
                        )
                    )
                )

            # Generate
            response = client.models.generate_content(
                model='gemini-3-pro-image-preview', # Or 'imagen-3.0-generate-001' if supported directly
                contents=[types.Content(parts=parts)]
            )

            # Save
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        img_data = base64.b64decode(part.inline_data.data)
                        with open(output_path, "wb") as f:
                            f.write(img_data)
                        print(f"  - Saved to {output_path}")
                        break
            else:
                print(f"  - No image generated for {custom_id}")

            # Sleep to avoid rate limits?
            time.sleep(2) 

        except Exception as e:
            print(f"  - Error generating {custom_id}: {e}")

if __name__ == "__main__":
    generate_images_sequential()
