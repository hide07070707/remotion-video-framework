import os
import re
import json

INPUT_FILE = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\narration_script.md'
OUTPUT_JSON = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\src\text_map.json'

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    full_map = []
    
    current_chapter = 0
    
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Detect Chapter Header
        ch_match = re.match(r'## Chapter (\d+)', line)
        if ch_match:
            current_chapter = int(ch_match.group(1))
            continue
            
        # Detect Scene Line: chX_scYY: Text
        # Regex to capture ID and Text
        # Note: Sometimes text might contain colons, so we limit split
        match = re.match(r'(ch\d+_sc\d+):\s*(.*)', line)
        if match:
            sc_id = match.group(1)
            text = match.group(2)
            
            # Double check chapter consistency if needed, but ID usually has it
            # sc_id is ch1_sc01
            
            full_map.append({
                "id": sc_id,
                "text": text,
                "chapter": current_chapter, 
                # Parse scene number from ID for sorting if needed
                "scene": int(sc_id.split('_sc')[1])
            })

    print(f"Found {len(full_map)} segments.")
    
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(full_map, f, indent=2, ensure_ascii=False)
    print(f"Exported text map to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
