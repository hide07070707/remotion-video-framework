import os
import re
import json
from PIL import Image, ImageDraw, ImageFont

# Config
INPUT_JSONL = r'video/public/assets/batch_requests_217.jsonl'
OUTPUT_BASE_DIR = r'video/public/assets'

def generate_placeholders():
    if not os.path.exists(INPUT_JSONL):
        print("JSONL not found.")
        return

    count = 0
    with open(INPUT_JSONL, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            data = json.loads(line)
            scene_id = data['custom_id']
            # Prompt text for display
            prompt = data['body']['contents']['parts'][0]['text']
            # Shorten prompt
            prompt_short = prompt[:100] + "..." if len(prompt) > 100 else prompt

            # Determine path
            match = re.match(r'ch(\d+)_sc(\d+)', scene_id)
            if not match: continue
            ch_num = match.group(1)
            
            chapter_dir = os.path.join(OUTPUT_BASE_DIR, f"chapter{ch_num}")
            os.makedirs(chapter_dir, exist_ok=True)
            output_path = os.path.join(chapter_dir, f"{scene_id}.png")

            # Create Image
            # 16:9 ratio, e.g. 1280x720 (High enough for preview)
            img = Image.new('RGB', (1280, 720), color=(20, 20, 30))
            d = ImageDraw.Draw(img)
            
            # Draw Text
            try:
                # Default font might be too small, try to load a font or use default
                # Windows usually has arial.ttf
                font_large = ImageFont.truetype("arial.ttf", 60)
                font_small = ImageFont.truetype("arial.ttf", 24)
            except IOError:
                font_large = ImageFont.load_default()
                font_small = ImageFont.load_default()

            # Center Scene ID
            d.text((50, 50), f"SCENE: {scene_id}", fill=(255, 255, 0), font=font_large)
            
            # Wrap prompt text roughly
            margin = 50
            offset = 150
            import textwrap
            lines = textwrap.wrap(prompt_short, width=80) # Approx chars
            for line in lines:
                d.text((margin, offset), line, fill=(200, 200, 200), font=font_small)
                offset += 30

            # Save
            img.save(output_path)
            print(f"Generated {output_path}")
            count += 1

    print(f"Finished generating {count} placeholders.")

if __name__ == "__main__":
    generate_placeholders()
