import re
import os

INPUT_FILE = r'video/public/assets/narration_script.md'
OUTPUT_FILE = r'video/public/assets/narration_script_refined.md'

MIN_CHARS = 15 # Target minimum length for a segment

def refine_script():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by chapters to process each independently
    # Note: We want to preserve the chapter structure but refine the scenes within.
    parts = re.split(r'(## Chapter \d+)', content)
    
    refined_content = "# Narration Script (Refined Natural Flow)\n\n"
    
    # Process pairs: (Header, Body)
    # The first part might be empty or preamble
    if parts[0].strip().startswith('#'):
        # Usually preamble
        pass 
        
    for i in range(1, len(parts), 2):
        header = parts[i]
        body = parts[i+1] # This contains chX_scYY lines
        
        # 1. Extract raw text from body
        # Remove chX_scYY: prefixes
        # Remove any lingering chapter titles like ": 静かな朝の予兆" (matched crudely)
        raw_text = ""
        lines = body.strip().split('\n')
        for line in lines:
            line = line.strip()
            if not line: continue
            
            # Match ID and content
            match = re.match(r'(ch\d+_sc\d+):\s*(.*)', line)
            if match:
                text_part = match.group(2)
                # Cleaning specific known artifacts (User request: remove chapter titles)
                text_part = re.sub(r'^:\s*.*?(?=[^\s]+)', '', text_part) # Remove leading colon+title if present?
                # Actually, the user's diff showed "ch1_sc01: : TitleText" -> ": Title" removed.
                # Let's remove any text that looks like a title if it starts with ": "
                if text_part.startswith(": "):
                    text_part = text_part.split(" ", 1)[-1] if " " in text_part else ""
                
                # Specific removal of known chapter titles from text if embedded
                for title in ["静かな朝の予兆", "毒の晩餐", "吸い取られた魂", "鏡の中の「自由」", "優しい拒絶"]:
                   text_part = text_part.replace(title, "")

                raw_text += text_part

        # 2. Re-segment raw text
        # Logic: Split by major punctuation, then merge if too short.
        # Punctuations to split on: 。 、 ? ! 」 』
        
        # Simple approach: 
        # Iterate chars, accumulate buffer.
        # If char is split-char:
        #   If buffer >= MIN_CHARS: yield buffer, reset.
        #   Else: keep accumulating (too short to be a scene).
        # Exception: buffer is huge > 40? Force split at comma?
        
        segments = []
        buffer = ""
        
        # Pre-clean raw text (remove spaces, newlines)
        raw_text = raw_text.replace('\n', '').replace(' ', '').replace('　', '')
        
        # Special split markers (keep them)
        raw_text = raw_text.replace('。', '。|').replace('、', '、|').replace('」', '」|').replace('』', '』|')
        # Also split on ? !
        raw_text = raw_text.replace('？', '？|').replace('！', '！|')

        potential_segments = raw_text.split('|')
        
        current_chunk = ""
        for seg in potential_segments:
            if not seg: continue
            
            # Check if adding this segment makes it "good"
            temp = current_chunk + seg
            
            if len(temp) >= MIN_CHARS:
                segments.append(temp)
                current_chunk = ""
            else:
                # Too short, keep buffering
                current_chunk = temp
        
        # Append remainder
        if current_chunk:
            if segments:
                segments[-1] += current_chunk # Merge to last if possible
            else:
                segments.append(current_chunk)

        # 3. Format output
        refined_content += f"{header}\n"
        ch_num = int(re.search(r'\d+', header).group())
        
        for idx, seg in enumerate(segments):
            sc_num = idx + 1
            refined_content += f"ch{ch_num}_sc{sc_num:02d}: {seg}\n"
        
        refined_content += "\n"

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(refined_content)

    print(f"Refined script written to {OUTPUT_FILE}")

if __name__ == "__main__":
    refine_script()
