from PIL import Image, ImageDraw, ImageFont
import os
import json
import textwrap

MANIFEST_PATH = r'video/src/manifest.json'
OUTPUT_BASE_DIR = r'video/public/assets'

def generate_production_placeholders():
    if not os.path.exists(MANIFEST_PATH):
        print("Manifest not found.")
        return

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        items = json.load(f)

    # Font setup (try to find a system font or default)
    try:
        font_large = ImageFont.truetype("arial.ttf", 60)
        font_small = ImageFont.truetype("arial.ttf", 40)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()

    print(f"Generating placeholders for {len(items)} scenes...")

    for item in items:
        ch = item['chapter']
        sc_id = item['id']
        text = item['text']

        # Directory
        ch_dir = os.path.join(OUTPUT_BASE_DIR, f"chapter{ch}")
        os.makedirs(ch_dir, exist_ok=True)
        path = os.path.join(ch_dir, f"{sc_id}.png")

        # Create Image
        # Dark blue background for 'emotional' vibe :)
        img = Image.new('RGB', (1920, 1080), color=(10, 10, 30))
        d = ImageDraw.Draw(img)

        # Draw ID
        d.text((50, 50), f"SCENE: {sc_id}", font=font_large, fill=(200, 200, 255))
        
        # Draw Text (Wrapped)
        wrapper = textwrap.TextWrapper(width=40)
        wrapped_text = wrapper.fill(text)
        d.text((100, 200), wrapped_text, font=font_small, fill=(255, 255, 255))

        # Draw "Production Placeholder" stamp
        d.text((1400, 1000), "PRODUCTION PLACEHOLDER", font=font_small, fill=(100, 100, 100))

        img.save(path)
        # print(f"Saved {path}") 

    print("All placeholders generated.")

if __name__ == "__main__":
    generate_production_placeholders()
