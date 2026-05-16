import os
import re
import time
import base64
import concurrent.futures
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
client = genai.Client(api_key=API_KEY)

# Reverting to the model from previous successful script
MODEL_NAME = "gemini-3-pro-image-preview" 

PLAN_FILE = r'video/direction_plan_all.md'
OUTPUT_BASE_DIR = r'video/public/assets'
UPLOAD_CACHE = {}

def parse_plan(md_file, target_chapter=None):
    requests = []
    with open(md_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for line in lines:
        if line.startswith('| **ch'):
            parts = line.split('|')
            if len(parts) >= 5:
                # | ID | Direction | Subtitle | Final_Prompt |
                scene_id = parts[1].strip().replace('**', '')
                
                # Filter by chapter if requested
                if target_chapter:
                    if not scene_id.startswith(f"ch{target_chapter}_"):
                        continue
                        
                prompt_raw = parts[4].strip()
                
                # Parse Ref
                ref_path = None
                # Regex to find "Ref: path/to/image.png"
                ref_match = re.search(r'Ref:\s*([^\s,]+)', prompt_raw)
                if ref_match:
                    ref_path = ref_match.group(1).strip()
                    # Remove Ref: ... from text to clean it up? 
                    prompt_text = prompt_raw.replace(ref_match.group(0), "").strip()
                else:
                    prompt_text = prompt_raw
                
                # Cleanup double commas or spaces
                prompt_text = re.sub(r',\s*,', ',', prompt_text)
                prompt_text = re.sub(r'\s+', ' ', prompt_text)
                
                requests.append({
                    "id": scene_id,
                    "prompt": prompt_text,
                    "ref": ref_path
                })
    return requests

def get_uploaded_file(path):
    if not path or not os.path.exists(path):
        return None
    
    if path in UPLOAD_CACHE:
        return UPLOAD_CACHE[path]
    
    print(f"Uploading reference: {path}")
    try:
        file_ref = client.files.upload(file=path, config={'mime_type': 'image/png'})
        
        # Wait for value
        start_time = time.time()
        while True:
             f = client.files.get(name=file_ref.name)
             if f.state.name == "ACTIVE":
                 break
             if f.state.name == "FAILED":
                 print(f"Failed to process {path}")
                 return None
             if time.time() - start_time > 60:
                 return None
             time.sleep(1)
             
        UPLOAD_CACHE[path] = file_ref.uri
        return file_ref.uri
    except Exception as e:
        print(f"Upload error: {e}")
        return None

def generate_single_image(req):
    scene_id = req["id"]
    base_prompt = req["prompt"]
    ref_path = req["ref"]
    
    # System instruction tailored for this task
    system_instruction = (
        "You are an expert anime background and character artist. "
        "RESTRICTION: You must strictly follow the facial features and hair style of the character in the reference image. "
        "HOWEVER, for CLOTHING, you MUST prioritize the text description in the prompt over the reference image. "
        "If the text says 'light blue blouse' and the reference shows something else, DRAW THE LIGHT BLUE BLOUSE. "
        "Do not render any text, subtitles, or watermarks."
    )
    
    # scene_id format chX_scYY
    match = re.search(r'ch(\d+)_sc(\d+)', scene_id)
    if not match: return
    ch_num = match.group(1)
    
    chapter_dir = os.path.join(OUTPUT_BASE_DIR, f"chapter{ch_num}")
    os.makedirs(chapter_dir, exist_ok=True)
    output_path = os.path.join(chapter_dir, f"{scene_id}.png")
    
    # Check if exists (simple check)
    # kw: User requested RE-GENERATION of Chapter 1. Force overwrite.
    # if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
    #    print(f"Skipping {scene_id} (Exists)")
    #    return

    print(f"Generating {scene_id} with Ref: {os.path.basename(ref_path) if ref_path else 'None'}")
    
    try:
        parts = []
        if ref_path:
            ref_uri = get_uploaded_file(ref_path)
            if ref_uri:
                parts.append(types.Part.from_uri(file_uri=ref_uri, mime_type="image/png"))
        
        full_prompt = f"{system_instruction}\n\nPROMPT: {base_prompt}"
        parts.append(types.Part.from_text(text=full_prompt))
        
        # Generation Loop
        # Removed config causing issues. Relying on default behavior of the specific image model.
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
                            print(f"SUCCESS: Saved {scene_id}")
                            return
                print(f"  Attempt {attempt+1}: No image data for {scene_id}")
            except Exception as inner_e:
                print(f"  Attempt {attempt+1} Error {scene_id}: {inner_e}")
                # Exponential backoff starting at 10s
                time.sleep(10 * (2 ** attempt))
        
        print(f"FAILED: {scene_id} after 3 attempts")
            
    except Exception as e:
        print(f"Critical Error {scene_id}: {e}")

def main():
    print(f"Reading plan: {PLAN_FILE}")
    # Filter for Chapter 1
    requests = parse_plan(PLAN_FILE, target_chapter=1)
    print(f"Found {len(requests)} scenes for Chapter 1.")
    
    # Sequential execution to avoid rate limits or upload race conditions initially
    # Reduced to 1 worker to be gentle on the API
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        futures = {executor.submit(generate_single_image, req): req['id'] for req in requests}
        for future in concurrent.futures.as_completed(futures):
            # Just consume
            pass

if __name__ == "__main__":
    main()
