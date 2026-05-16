import os
import time
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
client = genai.Client(api_key=API_KEY)

ASSETS_DIR = r'video/public/assets'

REFS = {
    'ref_yoko.png': "Kyoto Animation style, cinematic lighting, emotional and delicate line art, 8k resolution, [Yoko: 60s, silver-gray bob hair, beige cardigan], [Character Design Sheet, White Background, Front View, Side View, Expression Sheet]",
    'ref_michiko.png': "Kyoto Animation style, cinematic lighting, emotional and delicate line art, 8k resolution, [Michiko: 60s, rose-pink top, pearl necklace], [Character Design Sheet, White Background, Front View, Side View, Expression Sheet]"
}

def generate_ref(filename, prompt):
    print(f"Generating {filename}...")
    try:
        # Use imagen-3.0-generate-001 model via new SDK
        response = client.models.generate_images(
            model='gemini-2.0-flash-exp',
            prompt=prompt,
            config={
                'aspect_ratio': "1:1",
                'person_generation': "allow_adult",
                'safety_filter_level': "block_few"
            }
        )
        
        if response.generated_images:
            image_bytes = response.generated_images[0].image.image_bytes
            with open(os.path.join(ASSETS_DIR, filename), 'wb') as f:
                f.write(image_bytes)
            print(f"  Saved {filename}")
            return True
        else:
            print("  No images generated.")
            
    except Exception as e:
        print(f"  Error: {e}")
        # Fallback to older model if available or different method?
    return False

if __name__ == "__main__":
    for fname, prompt in REFS.items():
        generate_ref(fname, prompt)
        time.sleep(2)
