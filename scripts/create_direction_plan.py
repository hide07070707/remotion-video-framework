import re
import os

SCRIPT_FILE = r'video/full_script_latest.txt'
OUTPUT_FILE = r'video/direction_plan_all.md'

# Production Rules
STYLE_PREFIX = "(2D flat anime style:1.5), Kyoto Animation style, delicate line art, emotional and soft colors"
NEGATIVE_PROMPT = "No photorealism, no 3D render, no CGI, no realistic skin textures, no real-life photos, text, subtitles, watermark, (worst quality, low quality:1.4)"
ASPECT_RATIO = "--ar 16:9"

# Costume definitions with stronger weights for consistency vs Master Ref
CHARS = {
    "Yoko": {
        "A": "(wearing a light blue blouse and charcoal gray trousers:1.3)",
        "B": "(wearing a beige cardigan and pearl necklace:1.3)",
        "C": "(wearing a Japanese sailor-style school uniform (Serafuku), black hair short bob:1.3)" # Flashback
    },
    "Michiko": "(wearing a rose-pink top and pearl necklace:1.3)",
    "Masahiro": "(wearing a knit cardigan over a collared shirt:1.3)"
}

REFS = {
    "Yoko": "Ref: video/public/assets/characters/yoko_master.png",
    "Michiko": "Ref: video/public/assets/characters/michiko_master.png",
    "Masahiro": "Ref: video/public/assets/characters/masahiro_master.png"
}

# Chapter Contexts
CONTEXTS = {
    1: {"loc": "Home, morning light", "costume": "A"},
    2: {"loc": "Italian Restaurant, bright indoor", "costume": "B"},
    3: {"loc": "Home, evening, dark room", "costume": "A"},
    4: {"loc": "Park, winter day", "costume": "B"},
    5: {"loc": "Home, bright morning", "costume": "A"}
}

def split_and_merge_text(text):
    # 1. First, cleanup lines and remove empty ones
    raw_lines = text.split('\n')
    cleaned_lines = [l.strip() for l in raw_lines if l.strip()]
    
    merged = []
    buffer = ""
    
    # Target length for a single scene subtitle (approx characters)
    # JP: 20-50 chars is good for a movie-like subtitle duration.
    # User requested 150-180 scenes. Previous 40 resulted in ~130. 
    # Lowering to 30 should increase count to ~160.
    TARGET_LENGTH = 30 
    
    for line in cleaned_lines:
        # Check if line is just "..." or very short
        if re.match(r'^[…。\s]+$', line):
            continue 

        # If adding this line exceeds target length significantly, flush buffer
        if len(buffer) + len(line) > TARGET_LENGTH * 1.5:
            if buffer:
                merged.append(buffer)
            buffer = line
        else:
            # Append to buffer
            if buffer:
                buffer += " " + line
            else:
                buffer = line
                
        # If the line ends with a definite stop like 」, flush if buffer is decent size
        # This preserves rhythm changes in dialogue
        if line.endswith('」') and len(buffer) > 15:
             merged.append(buffer)
             buffer = ""
             
    if buffer:
        merged.append(buffer)
        
    return merged

def format_subtitle(text):
    # Insert <br> if too long
    # Since we merged lines, this is more important now
    if len(text) > 20 and '<br>' not in text:
        mid = len(text) // 2
        # Function to find nearest split point
        split_candidates = [m.start() for m in re.finditer(r'[、。 ]', text)]
        if split_candidates:
            # Pick closest to mid
            best = min(split_candidates, key=lambda x: abs(x - mid))
            return text[:best+1] + "<br>" + text[best+1:]
        else:
            return text[:mid] + "<br>" + text[mid:]
    return text

def generate_row(cid, scene_num, text, chapter_num):
    ctx = CONTEXTS.get(chapter_num, CONTEXTS[1])
    location = ctx["loc"]
    
    # Determine Character & Costume
    char_name = "Yoko"
    costume = CHARS["Yoko"][ctx["costume"]]
    ref = REFS["Yoko"]
    
    # Handling Flashback in Ch1 (approx scene checks or keywords)
    if chapter_num == 1 and ("中学" in text or "昔" in text):
        costume = CHARS["Yoko"]["C"]
        location = "Sepia tone, nostalgic background"
        
    # Handling Michiko specific scenes
    if "美智子は" in text or "彼女は" in text:
        char_name = "Michiko"
        costume = CHARS["Michiko"]
        ref = REFS["Michiko"]
    
    # Context-aware prompts
    prompt_desc = "Cinematic shot, emotional atmosphere, facial close up or upper body"
    
    # Keyword overrides
    if "珈琲" in text or "カップ" in text:
         prompt_desc = "holding a coffee cup, looking down"
    elif "スマホ" in text or "電話" in text or "スマートフォン" in text:
         prompt_desc = "looking at smartphone screen, serious expression"
    elif "花" in text or "山茶花" in text:
         prompt_desc = "looking at flowers in garden, soft expression"
    elif "時計" in text:
         prompt_desc = "looking at antique wall clock, thoughtful"
         
    camera = "Wide shot" if scene_num % 4 == 0 else "Close up, face focus"
         
    camera = "Wide shot" if scene_num % 4 == 0 else "Close up, face focus"
    
    final_prompt = f"{STYLE_PREFIX}, {char_name} {costume}, {prompt_desc}, {location}, {camera}, {ref} --no {NEGATIVE_PROMPT} {ASPECT_RATIO}"
    
    direction = "日常の描写"
    
    return f"| **ch{chapter_num}_sc{scene_num:02d}** | {direction} | {format_subtitle(text)} | {final_prompt} |"

def main():
    with open(SCRIPT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    output_lines = []
    output_lines.append(f"# Direction Plan - All Chapters\n")
    output_lines.append(f"| ID | 演出意図 (Direction) | 字幕内容 (Subtitle) | Final_Prompt |")
    output_lines.append(f"| :--- | :--- | :--- | :--- |")
    
    # Split by Chapter
    sections = re.split(r'(# 第[一二三四五]章[^\n]*)', content)
    
    current_ch = 0
    scene_count = 1
    
    for section in sections:
        section = section.strip()
        if not section: continue
        
        if section.startswith("# 第"):
            if "一" in section: current_ch = 1
            elif "二" in section: current_ch = 2
            elif "三" in section: current_ch = 3
            elif "四" in section: current_ch = 4
            elif "五" in section: current_ch = 5
            scene_count = 1 
            output_lines.append(f"| | | **{section}** | |")
            continue
            
        if current_ch == 0: continue 
        
        # Merge logic
        lines = split_and_merge_text(section)
        
        for line in lines:
            row = generate_row(f"ch{current_ch}", scene_count, line, current_ch)
            output_lines.append(row)
            scene_count += 1

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("\n".join(output_lines))
    
    print(f"Generated {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
