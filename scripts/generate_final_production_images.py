import os
import json
import time
import base64
import google.genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Configuration
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
MANIFEST_PATH = r'video/src/manifest.json'
OUTPUT_BASE_DIR = r'video/public/assets'
MODEL_NAME = 'gemini-2.0-flash' # Using 2.0 Flash for speed/quality balance. Fallback to imagen if needed.

# Style & Character Definition
STYLE_PROMPT = (
    "Anime art style, Kyoto Animation (KyoAni) quality, soft emotional lighting, "
    "highly detailed, 4k resolution, cinematic composition. "
    "Character: Yoko, an elegant 65-year-old Japanese woman, silver hair in a neat bob, "
    "gentle face with subtle wrinkles, wearing simple, high-quality mature clothing. "
    "Atmosphere: Melancholic but beautiful, quiet everyday life. "
    "Scene Context: "
)

print("DEBUG: Script Start")

def generate_production_images():
    print("DEBUG: Function called")
    if not API_KEY:
        print("Error: API Key not found.")
        return

    print(f"Initializing Client with model: {MODEL_NAME}")
    client = google.genai.Client(api_key=API_KEY)

    # Load Manifest
    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found at {MANIFEST_PATH}")
        return

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest_items = json.load(f)

    total = len(manifest_items)
    print(f"Loaded {total} scenes from manifest.")

    for i, item in enumerate(manifest_items):
        chapter = item['chapter']
        scene_id = item['id']
        narrative_text = item['text']

        # Determine Output Path
        chapter_dir = os.path.join(OUTPUT_BASE_DIR, f"chapter{chapter}")
        os.makedirs(chapter_dir, exist_ok=True)
        output_path = os.path.join(chapter_dir, f"{scene_id}.png")

        # Skip if exists (Optional, user said discard so we deleted, but good for restart)
        if os.path.exists(output_path):
            print(f"[{i+1}/{total}] Skipping {scene_id} (Exists)")
            continue

        # Construct Prompt
        prompt = f"{STYLE_PROMPT} {narrative_text}"
        
        print(f"[{i+1}/{total}] Generating {scene_id}...")
        
        # Retry Loop
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Attempt 1: Imagen 3 (Fast) via generate_content
                try:
                    # Using generate_content for Imagen?
                    # Some docs suggest this for specific endpoints.
                    response = client.models.generate_content(
                        model='models/imagen-3.0-generate-001',
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="image/png"
                        )
                    )
                    # Check for inline data
                    if response.candidates and response.candidates[0].content.parts:
                        for part in response.candidates[0].content.parts:
                            if part.inline_data:
                                img_data = base64.b64decode(part.inline_data.data)
                                with open(output_path, "wb") as f:
                                    f.write(img_data)
                                print(f"  - Saved (Imagen 3 GenContent).")
                                break
                        else:
                             raise Exception("No image part in content")
                        break
                except Exception as e_imagen:
                    print(f"  - Imagen 3 (content) failed: {e_imagen}")
                    
                    # Attempt 2: Gemini 2.0 Flash Exp via generate_content (Simple)
                    try:
                        response = client.models.generate_content(
                            model='models/gemini-2.0-flash-exp', 
                            contents=prompt
                        )
                         # Check for inline data
                        if response.candidates and response.candidates[0].content.parts:
                            found = False
                            for part in response.candidates[0].content.parts:
                                if part.inline_data:
                                    img_data = base64.b64decode(part.inline_data.data)
                                    with open(output_path, "wb") as f:
                                        f.write(img_data)
                                    print(f"  - Saved (Gemini 2.0 Flash Content).")
                                    found = True
                                    break
                            if found: break
                    except Exception as e_flash:
                        print(f"  - Gemini 2.0 Flash failed: {e_flash}")

                    raise e_imagen

            except Exception as e:
                print(f"  - Attempt {attempt+1} overall failed.")
                time.sleep(2 * (attempt + 1))
        
        # Rate limit pause
        time.sleep(1)

if __name__ == "__main__":
    generate_production_images()
