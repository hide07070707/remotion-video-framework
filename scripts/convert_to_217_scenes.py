import re
import os

INPUT_FILE = r'video/public/assets/narration_script.md'
OUTPUT_FILE = r'video/public/assets/narration_script_217.md'

def main():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    parts = re.split(r'## Chapter (\d+)', content)
    new_content = "# Narration Script (Cinematic 217)\n\n"
    
    total_scenes = 0

    for i in range(1, len(parts), 2):
        ch_num = parts[i]
        text_content = parts[i+1]
        
        # Clean existing IDs
        text_content = re.sub(r'ch\d+_sc\d+:\s*', '', text_content)
        text_content = text_content.replace('\n', '')
        
        # Split logic
        segments = []
        sentences = re.split(r'(?<=。)', text_content)
        
        for s in sentences:
            s = s.strip()
            if not s: continue
            if len(s) > 40 and '、' in s:
                subs = re.split(r'(?<=、)', s)
                segments.extend([sub.strip() for sub in subs if sub.strip()])
            else:
                segments.append(s)
        
        # Write to new format
        new_content += f"## Chapter {ch_num}\n"
        for idx, seg in enumerate(segments):
            scene_id = f"ch{ch_num}_sc{idx+1:03d}" # 3 digits just in case, or stick to 2 if <100?
            # User used scXX (2 digits). 55 scenes fits in 2 digits.
            scene_id = f"ch{ch_num}_sc{idx+1:02d}"
            new_content += f"{scene_id}: {seg}\n"
            total_scenes += 1
        new_content += "\n"

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Generated {OUTPUT_FILE} with {total_scenes} scenes.")

if __name__ == "__main__":
    main()
