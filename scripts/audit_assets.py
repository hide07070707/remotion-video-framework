import os
import re
import json

# Paths
BASE_DIR = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video'
SCRIPT_FILE = os.path.join(BASE_DIR, 'public', 'assets', 'narration_script.md')
MANIFEST_FILE = os.path.join(BASE_DIR, 'src', 'manifest.json')
AUDIO_DIR = os.path.join(BASE_DIR, 'public', 'assets', 'audio')
IMAGE_DIR = os.path.join(BASE_DIR, 'public', 'assets')

def parse_markdown(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    chapters = {}
    # Split by Chapter headers
    parts = re.split(r'## Chapter (\d+)', content)
    # parts[0] is preamble/empty
    # parts[1] is Ch Number, parts[2] is text
    
    for i in range(1, len(parts), 2):
        ch_num = int(parts[i])
        text_block = parts[i+1].strip()
        
        # Extract segments
        # Logic matches generate_all_narration.py (simplified)
        # But we need to know what the INTENDED segmentation was.
        # Since audio is already generated as chX_scYY.mp3, we assume 20 segments per chapter.
        # We need to verify if we have 20 * 5 = 100 items.
        chapters[ch_num] = "Present"
        
    return chapters

def audit():
    print("--- Starting Audit ---")
    
    # 1. Load Manifest
    with open(MANIFEST_FILE, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
        
    print(f"Manifest Items: {len(manifest)}")
    
    # 2. Check each expected scene (Ch1-5, Sc1-20)
    missing_audio = []
    missing_images = []
    manifest_ids = {item['id']: item for item in manifest}
    
    for ch in range(1, 6):
        for sc in range(1, 21):
            scene_id = f"ch{ch}_sc{sc:02d}"
            
            # Check Manifest
            if scene_id not in manifest_ids:
                print(f"[MISSING MANIFEST] {scene_id}")
            
            # Check Audio File
            # Path should be assets/audio/chapterX/chX_scYY.mp3
            audio_path = os.path.join(AUDIO_DIR, f"chapter{ch}", f"{scene_id}.mp3")
            if not os.path.exists(audio_path):
                missing_audio.append(audio_path)
                print(f"[MISSING AUDIO] {scene_id} -> {audio_path}")
            
            # Check Image File
            # Path should be assets/chapterX/chX_scYY.png
            image_path = os.path.join(IMAGE_DIR, f"chapter{ch}", f"{scene_id}.png")
            if not os.path.exists(image_path):
                missing_images.append(image_path)
                print(f"[MISSING IMAGE] {scene_id} -> {image_path}")

    if not missing_audio and not missing_images:
        print("SUCCESS: All 100 Audio/Image files exist.")
    else:
        print(f"FAILED: Missing {len(missing_audio)} audio and {len(missing_images)} images.")

    print("--- Audit Complete ---")

if __name__ == "__main__":
    audit()
