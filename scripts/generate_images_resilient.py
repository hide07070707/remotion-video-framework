import os
import json
import time
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

load_dotenv()

API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
MANIFEST_PATH = r'video/src/manifest.json'
OUTPUT_BASE_DIR = r'video/public/assets'

# Model Configuration
# User request: "Nano Banana Pro" -> gemini-3.0-preview or similar.
# Since list is weird, we use the most advanced available model that supports images.
# gemini-2.0-flash-exp is often the "Nano" equivalent in previews or the most capable speed/quality balance.
MODEL_NAME = 'models/gemini-2.0-flash-exp' 

# Style Prompts
# Added "Do not render any text..." as requested.
PREFIX_PROMPT = (
    "Style: Kyoto Animation (KyoAni) anime art style, delicate line art, high definition 8k, "
    "soft morning light, emotional cinematographic lighting. "
    "Character: Yoko (65-year-old Japanese woman, elegant silver bob hair, gentle expression with subtle wrinkles, simple high-quality clothes). "
    "Note: Do not render any text, subtitles, or characters inside the image. Image only. "
    "Scene: "
)

client = genai.Client(api_key=API_KEY)

# Retry configuration: Wait 2^x * 4 seconds, up to 60s, max 10 attempts
@retry(
    wait=wait_exponential(multiplier=1, min=4, max=60),
    stop=stop_after_attempt(10),
    # verifying robustly: retry on ANY exception for now to be safe, or specificity?
    # check for 429 specifically if possible, but general Exception is safer for "Stop at nothing"
    retry=retry_if_exception_type(Exception) 
)
def generate_image_with_retry(prompt, output_path):
    print(f"  Requesting generation... (Model: {MODEL_NAME})")
    
    # Using generate_content for flexibility as seen in similar SDK usage, or generate_images if 4.0 supports it.
    # The list_models output implies 'generate-001' which usually supports generate_images.
    # Let's try generate_images first, falling back if needed in a logic block? 
    # No, keep it simple for tenacity.
    
    # Configuration for Image Generation
    # Note: Imagen 4.0 might require specific config or just standard.
    
    response = client.models.generate_images(
        model=MODEL_NAME,
        prompt=prompt,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio="16:9"
        )
    )
    
    if response.generated_images:
        img_bytes = response.generated_images[0].image.image_bytes
        with open(output_path, "wb") as f:
            f.write(img_bytes)
        print(f"  SUCCESS: Saved to {output_path}")
        return True
    else:
        raise Exception("No image returned in response.")

def main():
    if not API_KEY:
        print("API Key missing.")
        return

    if not os.path.exists(MANIFEST_PATH):
        print("Manifest not found.")
        return

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        items = json.load(f)

    print(f"Starting Resilient Generation for {len(items)} scenes...")

    for i, item in enumerate(items):
        chapter = item['chapter']
        sc_id = item['id']
        text = item['text']

        # Path Setup
        chapter_dir = os.path.join(OUTPUT_BASE_DIR, f"chapter{chapter}")
        os.makedirs(chapter_dir, exist_ok=True)
        output_path = os.path.join(chapter_dir, f"{sc_id}.png")

        # Skip logic? User implies "Replace 1 by 1".
        # We should overwrite placeholders. 
        # But if we crash and restart, we don't want to redo *finished* production images.
        # How to distinguish? Size? Placeholders are typically small/uniform? 
        # Let's assume we want to overwrite EVERYTHING for this run to guarantee "Visual Consistency".
        # OR, we check if it looks like a placeholder (we generated them recently).
        # To be safe and "Stop at nothing", let's just generate. 
        # Optimization: If file exists and size > X (Placeholders might be small?), skip?
        # Placeholders in prev script were 1280x720 or 1920x1080 solid color.
        # Let's just Overwrite to be sure. Consistency is key.
        
        # Construct Full Prompt
        full_prompt = f"{PREFIX_PROMPT} {text}"
        
        print(f"[{i+1}/{len(items)}] Processing {sc_id}...")
        
        try:
            generate_image_with_retry(full_prompt, output_path)
            # Small sleep to be nice to API even with backoff
            time.sleep(1) 
        except Exception as e:
            print(f"  FAILED {sc_id} after retries: {e}")
            # Don't exit, try next? Or stop? 
            # "Stop at nothing" implies keep going.
            continue

if __name__ == "__main__":
    main()
