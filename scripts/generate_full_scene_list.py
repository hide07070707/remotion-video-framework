import re
import os

INPUT_FILE = r'video/public/assets/narration_script.md'
OUTPUT_FILE = r'video/public/assets/scene_list_review.md'

def main():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    output = "# Full Scene List (217 Scenes)\n\n"
    output += "| Scene ID | Text Content (First 30 chars) | Image Status |\n"
    output += "| :--- | :--- | :--- |\n"
    
    parts = re.split(r'## Chapter (\d+)', content)
    
    for i in range(1, len(parts), 2):
        ch_num = parts[i]
        text_chunk = parts[i+1]
        
        # Parse lines like "ch1_sc01: text..."
        lines = text_chunk.strip().split('\n')
        for line in lines:
            if not line.strip(): continue
            match = re.match(r'(ch\d+_sc\d+): (.*)', line)
            if match:
                sid = match.group(1)
                text = match.group(2)
                
                # Check if old image exists (e.g. ch1_sc01.png)
                # Note: Old images are ch1_sc01...ch1_sc20. 
                # New IDs go up to sc55. 
                # So sc01-sc20 might physically exist, but semantically match? Unlikely to match perfectly 1:1.
                # We will mark check based on file existence only.
                
                img_path = os.path.join(r'video/public/assets', f'chapter{ch_num}', f'{sid}.png')
                exists = os.path.exists(img_path)
                
                status = "Existing File Found (Verify Content)" if exists else "Needs New Image"
                
                output += f"| {sid} | {text[:30]}... | {status} |\n"
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(output)
        
    print(f"Generated {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
