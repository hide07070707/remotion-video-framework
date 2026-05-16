import os
import json

MANIFEST_PATH = r'video/src/manifest.json'
OUTPUT_BASE_DIR = r'video/public/assets'

def verify():
    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        items = json.load(f)
    
    missing = []
    for item in items:
        ch = item['chapter']
        sc_id = item['id']
        path = os.path.join(OUTPUT_BASE_DIR, f"chapter{ch}", f"{sc_id}.png")
        if not os.path.exists(path):
            missing.append(path)
    
    if missing:
        print(f"FAILED: {len(missing)} assets missing.")
        for m in missing[:5]:
            print(f"  - {m}")
    else:
        print(f"SUCCESS: All {len(items)} assets verified.")

if __name__ == "__main__":
    verify()
