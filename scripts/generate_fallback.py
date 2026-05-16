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

# Fallback to standard Imagen model
MODEL_NAME = "imagen-4.0-generate-001" 

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
                scene_id = parts[1].strip().replace('**', '')
                if target_chapter and not scene_id.startswith(f"ch{target_chapter}_"):
                    continue
                prompt_raw = parts[4].strip()
                ref_path = None
                ref_match = re.search(r'Ref:\s*([^\s,]+)', prompt_raw)
                if ref_match:
                    ref_path = ref_match.group(1).strip()
                    prompt_text = prompt_raw.replace(ref_match.group(0), "").strip()
                else:
                    prompt_text = prompt_raw
                prompt_text = re.sub(r',\s*,', ',', prompt_text)
                prompt_text = re.sub(r'\s+', ' ', prompt_text)
                requests.append({"id": scene_id, "prompt": prompt_text, "ref": ref_path})
    return requests

def generate_single_image(req):
    scene_id = req["id"]
    base_prompt = req["prompt"]
    
    # Enhanced System Instruction for accuracy without Reference Image
    system_instruction = (
        "Anime style, Kyoto Animation style, delicate line art, emotional and soft colors. "
        "Character Yoko: **65 years old woman**, **gray hair short bob**, wrinkles, gentle face. "
        "She is wearing a light blue blouse and charcoal gray trousers. "
        "RESTRICTION: Do not draw her young. She is an elderly woman. "
    )
    
    # Check for flashback (Scene 17 in Ch1 is not flashback, but let's be safe if logic is needed)
    if "school uniform" in base_prompt or "middleschool" in base_prompt:
        system_instruction = "Anime style, Kyoto Animation style. Character Yoko (Young): Black hair, sailor school uniform."
    elif "Michiko" in base_prompt or "rose-pink" in base_prompt:
         system_instruction = (
            "Anime style, Kyoto Animation style. "
            "Character Michiko: 65 years old woman, energetic, wearing a rose-pink top and pearl necklace. "
         )

    match = re.search(r'ch(\d+)_sc(\d+)', scene_id)
    if not match: return
    ch_num = match.group(1)
    
    chapter_dir = os.path.join(OUTPUT_BASE_DIR, f"chapter{ch_num}")
    os.makedirs(chapter_dir, exist_ok=True)
    output_path = os.path.join(chapter_dir, f"{scene_id}.png")
    
    # Force overwrite if file exists to fix bad generation
    # if os.path.exists(output_path): 
    #    print(f"Skipping {scene_id} (Exists)")
    #    return

    print(f"Generating {scene_id} [Fallback]...")
    
    try:
        # Append strict negative prompt
        full_prompt = f"{system_instruction} {base_prompt} --no text, subtitles, watermark, signature, letters"
        
        response = client.models.generate_images(
            model=MODEL_NAME,
            prompt=full_prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="16:9"
            )
        )
        
        if response.generated_images:
            img = response.generated_images[0]
            if img.image:
                img_data = img.image.image_bytes
                with open(output_path, "wb") as f:
                    f.write(img_data)
                print(f"SUCCESS: Saved {scene_id}")
                return
        
        print(f"  No image data for {scene_id}")
            
    except Exception as e:
        print(f"Error {scene_id}: {e}")

def main():
    print(f"Reading plan: {PLAN_FILE}")
    requests = parse_plan(PLAN_FILE, target_chapter=1)
    print(f"Found {len(requests)} scenes for Chapter 1. Starting Fallback Generation.")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        futures = {executor.submit(generate_single_image, req): req['id'] for req in requests}
        for future in concurrent.futures.as_completed(futures):
            pass

if __name__ == "__main__":
    main()
