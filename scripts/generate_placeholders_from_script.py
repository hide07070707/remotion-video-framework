import os
import re
from PIL import Image, ImageDraw, ImageFont

# Config
SCRIPT_FILE = r'video/public/assets/narration_script.md'
OUTPUT_BASE_DIR = r'video/public/assets'

def generate_placeholders():
    if not os.path.exists(SCRIPT_FILE):
        print("Script not found.")
        return

    # Read script
    with open(SCRIPT_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    count = 0
    for line in lines:
        line = line.strip()
        match = re.match(r'(ch(\d+)_sc(\d+)):(.*)', line)
        if not match:
            continue

        scene_id = match.group(1)
        ch_num = match.group(2)
        text = match.group(4).strip()
        
        # Determine path
        chapter_dir = os.path.join(OUTPUT_BASE_DIR, f"chapter{ch_num}")
        os.makedirs(chapter_dir, exist_ok=True)
        output_path = os.path.join(chapter_dir, f"{scene_id}.png")

        # Create Image
        img = Image.new('RGB', (1280, 720), color=(20, 20, 40)) # Slightly different color to indicate update
        d = ImageDraw.Draw(img)
        
        try:
            font_large = ImageFont.truetype("arial.ttf", 60)
            # Try to find a font that supports Japanese for the text, or just use basic
            # Windows: msgothic.ttc or meiryo.ttc
            font_small = ImageFont.truetype("msgothic.ttc", 24)
        except IOError:
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()

        # Center Scene ID
        d.text((50, 50), f"SCENE: {scene_id}", fill=(0, 255, 255), font=font_large)
        
        # Draw Text (Wrap)
        margin = 50
        offset = 150
        import textwrap
        # Heuristic wrap for Japanese? Textwrap work mostly on spaces.
        # Just simple chunking
        chars_per_line = 30
        wrapped_lines = [text[i:i+chars_per_line] for i in range(0, len(text), chars_per_line)]
        
        for l in wrapped_lines:
            d.text((margin, offset), l, fill=(200, 200, 200), font=font_small)
            offset += 35

        img.save(output_path)
        # print(f"Generated {output_path}")
        count += 1

    print(f"Finished generating {count} placeholders from script.")

if __name__ == "__main__":
    generate_placeholders()
