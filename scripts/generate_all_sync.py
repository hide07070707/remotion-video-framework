import os
import re
import time
import base64
import json
import google.genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Configuration
INPUT_FILE = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\all_chapters_prompts_v2.md'
REF_URIS_FILE = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\ref_uris.json'
OUTPUT_BASE = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets'
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

if not API_KEY:
    print("Error: API Key not found.")
    exit(1)

CLIENT = google.genai.Client(api_key=API_KEY)

def load_ref_uris():
    if not os.path.exists(REF_URIS_FILE):
        return {}
    with open(REF_URIS_FILE, 'r') as f:
        return json.load(f)

def parse_markdown(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex to extract standard prompts
    # Capture ID and Prompt
    pattern = re.compile(r'### (ch\d+_sc\d+)\s+.*?Final_Prompt:\s*(.*?)(?=\n###|\n##|\Z)', re.DOTALL)
    matches = pattern.findall(content)
    return matches

def should_process(custom_id):
    # ID format: ch3_sc05
    match = re.match(r'ch(\d+)_sc(\d+)', custom_id)
    if not match:
        return False
        
    chapter_num = int(match.group(1))
    scene_num = int(match.group(2))
    
    # Target: From Ch3 Sc05 to end of Ch5
    if chapter_num < 3:
        return False
    if chapter_num == 3 and scene_num < 6:
        return False
    if chapter_num > 5:
        return False
    return True

def generate_image(custom_id, prompt_text, ref_uris):
    # Determine Output Path
    chapter_num = custom_id.split('_')[0].replace('ch', '')
    chapter_dir = os.path.join(OUTPUT_BASE, f"chapter{chapter_num}")
    os.makedirs(chapter_dir, exist_ok=True)
    
    output_path = os.path.join(chapter_dir, f"{custom_id}.png")
    
    if os.path.exists(output_path):
        print(f"Skipping (Exists): {output_path}")
        return

    print(f"Generating {custom_id}...")

    # Prepare Parts
    prompt_text = prompt_text.strip().replace('\n', ' ')
    
    # We construct parts carefully
    # Use text prompt first
    final_parts = [types.Part.from_text(text=prompt_text)]
    
    # Inject Cref
    # Logic: simple string match
    if "[Yoko" in prompt_text or "Yoko:" in prompt_text:
        uri = ref_uris.get("Yoko", {}).get("uri")
        if uri:
            print("  + Adding Yoko Ref (URI)")
            final_parts.append(types.Part(file_data=types.FileData(file_uri=uri, mime_type="image/png")))
        
    if "[Michiko" in prompt_text or "Michiko:" in prompt_text:
        uri = ref_uris.get("Michiko", {}).get("uri")
        if uri:
            print("  + Adding Michiko Ref (URI)")
            final_parts.append(types.Part(file_data=types.FileData(file_uri=uri, mime_type="image/png")))

    try:
        # Using standard 'generate_content'
        response = CLIENT.models.generate_content(
            model='gemini-3-pro-image-preview',
            contents=[types.Content(parts=final_parts)]
        )
        
        # Save
        saved = False
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    # Verify mime type just in case
                    print(f"  > Received inline_data. Mime: {part.inline_data.mime_type}")
                    
                    # SDK might return bytes OR base64 string depending on version/config.
                    # Safety check for "Double Decoding" bug.
                    data_obj = part.inline_data.data
                    
                    if isinstance(data_obj, str):
                        # It is base64 string, need to decode
                        img_data = base64.b64decode(data_obj)
                    else:
                        # It is presumably bytes
                        img_data = data_obj

                    with open(output_path, "wb") as f:
                        f.write(img_data)
                    print(f"  > SAVED: {output_path} ({len(img_data)} bytes)")
                    saved = True
                    break
        
        if not saved:
            print("  ! No inline image data found.")
            if response.text:
                 print(f"  ! Response Text: {response.text[:200]}")
            # Do NOT save a file if failed.

    except Exception as e:
        print(f"  ! ERROR generating {custom_id}: {e}")

def main():
    if not os.path.exists(REF_URIS_FILE):
        print("Error: REF_URIS_FILE not found.")
        return

    refs = load_ref_uris()
    prompts = parse_markdown(INPUT_FILE)
    
    total = len(prompts)
    print(f"Found {total} prompts. Starting filtered generation...")
    
    # Generate all
    for i, (custom_id, prompt) in enumerate(prompts):
        if should_process(custom_id):
            generate_image(custom_id, prompt, refs)
            time.sleep(2) # Safety sleep

if __name__ == "__main__":
    main()
