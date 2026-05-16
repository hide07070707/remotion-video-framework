import os
import json
import re
import time
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
client = genai.Client(api_key=API_KEY)

INPUT_JSONL = r'video/public/assets/batch_requests_217.jsonl'
MISSING_LIST = r'missing_scenes.txt'
OUTPUT_BASE_DIR = r'video/public/assets'
NEW_REFS_FILE = r'new_ref_uris.json'

def get_missing_scenes():
    if not os.path.exists(MISSING_LIST):
        return []
    with open(MISSING_LIST, 'r') as f:
        return [line.strip() for line in f if line.strip()]

def load_requests():
    requests = {}
    if os.path.exists(INPUT_JSONL):
        with open(INPUT_JSONL, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    data = json.loads(line)
                    requests[data['custom_id']] = data
    return requests

def load_new_uris():
    if os.path.exists(NEW_REFS_FILE):
        with open(NEW_REFS_FILE, 'r') as f:
            return json.load(f)
    return {}

def generate_image(scene_id, request_data, new_uris):
    try:
        # 1. Parse Directory and Path
        match = re.match(r'ch(\d+)_sc(\d+)', scene_id)
        if not match:
            print(f"Invalid ID: {scene_id}")
            return False
        
        ch_num = match.group(1)
        chapter_dir = os.path.join(OUTPUT_BASE_DIR, f"chapter{ch_num}")
        os.makedirs(chapter_dir, exist_ok=True)
        output_path = os.path.join(chapter_dir, f"{scene_id}.png")

        if os.path.exists(output_path):
            print(f"  Skipping (Exists): {output_path}")
            return True

        # 2. Prepare Prompt
        raw_prompt = request_data['body']['contents']['parts'][0]['text']
        
        # Parse --cref and --cw
        cref_uri = None
        clean_prompt = raw_prompt
        cref_match = re.search(r'--cref\s+(https?://[^\s]+)', raw_prompt)
        
        if cref_match:
            old_uri = cref_match.group(1)
            clean_prompt = raw_prompt.replace(cref_match.group(0), "").strip()
            clean_prompt = re.sub(r'--cw\s+\d+', '', clean_prompt).strip()
            
            # Determine which character mapping
            # This is tricky without the original logic which mapped prompt words to files.
            # But we can try to guess or just rely on 'new_uris' having keys like 'ref_yoko.png'.
            # If the script that created batch_requests_217.jsonl used specific logic, we might need to look at the prompt text.
            
            if "Yoko" in raw_prompt and "ref_yoko.png" in new_uris:
                cref_uri = new_uris["ref_yoko.png"]
            elif "Michiko" in raw_prompt and "ref_michiko.png" in new_uris:
                cref_uri = new_uris["ref_michiko.png"]
            else:
                # If we can't find a new URI, we MUST drop the old one to avoid 403.
                print("  Warning: Reference image dropped (No new URI found).")
                cref_uri = None
        
        # 3. Construct API Request
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
        
        print(f"Generating {scene_id}...")
        
        # Retry Loop
        for attempt in range(3):
            try:
                # Use generate_content for Gemini 2.0 Flash (which supports image gen via multimodal output?)
                # Or use imagen-3.0 if available (checked earlier, it wasn't).
                # Previous generate_images_217.py used 'gemini-3-pro-image-preview' with generate_content.
                # I'll try 'gemini-2.0-flash-exp' with generate_content.
                
                response = client.models.generate_content(
                    model='gemini-2.0-flash-exp', # Or 'gemini-2.0-flash'
                    contents=[types.Content(parts=parts)],
                    config=types.GenerateContentConfig(
                        safety_settings=[
                             types.SafetySetting(
                                 category='HARM_CATEGORY_HARASSMENT',
                                 threshold='BLOCK_NONE'
                             ),
                             types.SafetySetting(
                                 category='HARM_CATEGORY_HATE_SPEECH',
                                 threshold='BLOCK_NONE'
                             ),
                             types.SafetySetting(
                                 category='HARM_CATEGORY_SEXUALLY_EXPLICIT',
                                 threshold='BLOCK_NONE'
                             ),
                             types.SafetySetting(
                                 category='HARM_CATEGORY_DANGEROUS_CONTENT',
                                 threshold='BLOCK_NONE'
                             )
                        ]
                    )
                )
                
                # Check for images in candidates
                if response.candidates and response.candidates[0].content.parts:
                    for part in response.candidates[0].content.parts:
                        if part.inline_data:
                            # Save
                            image_data = base64.b64decode(part.inline_data.data)
                            with open(output_path, 'wb') as f:
                                f.write(image_data)
                            print(f"  Success: {output_path}")
                            return True
                    # If no inline data, maybe text refusal?
                    print(f"  Failed: No inline data. Response text: {response.text}")
                else:
                    print(f"  Failed: No candidates.")
                    if response.prompt_feedback:
                         print(f"  Feedback: {response.prompt_feedback}")

            except Exception as e:
                print(f"  Attempt {attempt+1} Failed: {e}")
                if "429" in str(e) or "403" in str(e): # Treat 403 as possibly transient if unrelated to file
                   pass # Wait
                time.sleep(2)
            
            time.sleep(5) # Wait between attempts
        
        return False

    except Exception as e:
        print(f"Error processing {scene_id}: {e}")
        return False

def main():
    missing_ids = get_missing_scenes()
    if not missing_ids:
        print("No missing scenes found.")
        return

    requests_map = load_requests()
    new_uris = load_new_uris()
    
    print(f"Retrying {len(missing_ids)} scenes...")
    
    count = 0
    for scene_id in missing_ids:
        if scene_id in requests_map:
            if generate_image(scene_id, requests_map[scene_id], new_uris):
                count += 1
            time.sleep(2) # Base delay
        else:
            print(f"Warning: No request found for {scene_id}")

    print(f"Retry complete. Recovered {count}/{len(missing_ids)} images.")

if __name__ == "__main__":
    main()
