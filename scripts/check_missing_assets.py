import os
import re

SCRIPT_FILE = r'video/public/assets/narration_script.md'
ASSETS_DIR = r'video/public/assets'

def check_missing():
    with open(SCRIPT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all scene IDs
    scene_ids = re.findall(r'(ch\d+_sc\d+):', content)
    print(f"Found {len(scene_ids)} scenes in script.")

    missing = []
    for sid in scene_ids:
        # Determine chapter dir
        chapter_match = re.match(r'ch(\d+)_', sid)
        if chapter_match:
            chapter_num = chapter_match.group(1)
            chapter_dir = os.path.join(ASSETS_DIR, f"chapter{chapter_num}")
            img_path = os.path.join(chapter_dir, f"{sid}.png")
            
            if not os.path.exists(img_path):
                missing.append(sid)
    
    print(f"Missing {len(missing)} images.")
    for m in missing:
        print(f"MISSING: {m}")

    # Generate a retry JSONL file content or list
    if missing:
        with open('missing_scenes.txt', 'w') as f:
            for m in missing:
                f.write(m + '\n')

if __name__ == "__main__":
    check_missing()
