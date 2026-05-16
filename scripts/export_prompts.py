import json
import os

MANIFEST_PATH = r'video/src/manifest.json'
OUTPUT_FILE = r'prompt_list_217.txt'

# Style Prefix from generate_images_resilient.py
PREFIX_PROMPT = (
    "Style: Kyoto Animation (KyoAni) anime art style, delicate line art, high definition 8k, "
    "soft morning light, emotional cinematographic lighting. "
    "Character: Yoko (65-year-old Japanese woman, elegant silver bob hair, gentle expression with subtle wrinkles, simple high-quality clothes). "
    "Note: Do not render any text, subtitles, or characters inside the image. Image only. "
    "Scene: "
)

def export_prompts():
    if not os.path.exists(MANIFEST_PATH):
        print("Manifest not found.")
        return

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        items = json.load(f)

    print(f"Exporting prompts for {len(items)} scenes...")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out:
        for item in items:
            sc_id = item['id']
            text = item['text']
            
            # Format
            out.write(f"[File: {sc_id}.png]\n")
            out.write(f"Prompt: {PREFIX_PROMPT} {text}\n")
            out.write("\n")

    print(f"Successfully exported to {OUTPUT_FILE}")

if __name__ == "__main__":
    export_prompts()
