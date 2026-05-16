import re

INPUT_FILE = r'video/direction_plan_all.md'
OUTPUT_FILE = r'video/direction_plan_refined.md'

# Rules
MICHIKO_PROMPT = "Michiko (wearing a rose-pink top and pearl necklace), Ref: video/public/assets/characters/michiko_master.png"
YOKO_SCHOOL_PROMPT = "Yoko (wearing a Japanese sailor-style school uniform (Serafuku), black hair short bob)"
YOKO_HOME_PROMPT = "Yoko (wearing a light blue blouse and charcoal gray trousers), Ref: video/public/assets/characters/yoko_master.png"
YOKO_OUT_PROMPT = "Yoko (wearing a beige cardigan and pearl necklace), Ref: video/public/assets/characters/yoko_master.png"

# Keywords to switch to Michiko
MICHIKO_KEYWORDS = ["美智子", "彼女"] # "Kanojo" is context dependent (Her), usually Michiko in dialogue scenes

# Keywords for Insert Shots
INSERT_MAP = {
    "珈琲": "Close up of a coffee cup with steam rising, detailed ceramic texture",
    "カップ": "Close up of a coffee cup with steam rising, detailed ceramic texture",
    "時計": "Close up of an antique wall clock face, pendulum swinging",
    "電話": "Close up of a smartphone screen, notification light",
    "スマホ": "Close up of a smartphone on the table",
    "花": "Close up of seasonal flowers (Sazanka) in the garden, morning dew",
    "山茶花": "Close up of Sazanka flowers in winter morning",
    "手": "Close up of older woman's hands, detailed skin texture",
    "空": "Wide shot of the winter sky, emotional atmosphere",
    "窓": "View through a window, soft morning light",
    "イタリアン": "Restaurant interior, elegant table setting",
    "パスタ": "Delicious looking pasta dish on table",
    "ランチ": "Restaurant table with food and drinks",
    "公園": "Park bench with fallen leaves, winter atmosphere",
    "楠": "Large camphor tree branches against the sky",
    "月": "Night sky with moon and stars",
    "夜": "Night view of the city or window reflection"
}

def refine_line(line, prev_context):
    if not line.startswith("| **ch"):
        return line, prev_context
        
    parts = line.split("|")
    if len(parts) < 5: return line, prev_context
    
    scene_id = parts[1].strip()
    direction = parts[2].strip()
    subtitle = parts[3].strip().replace("<br>", "")
    prompt = parts[4].strip()
    
    # Update Context based on subtitle content
    current_context = prev_context
    for k, v in INSERT_MAP.items():
        if k in subtitle:
            current_context = v
            
    # 1. Handle Insert Shots
    if "【インサート】" in direction:
        # Replace generic prompt with context
        new_prompt = prompt.replace("Scenery, poetic atmosphere, close up of detailed object", current_context)
        parts[4] = f" {new_prompt} "
        return "|".join(parts), current_context

    # 2. Handle Flashback (Middle School)
    if "中学" in subtitle or "昔" in subtitle:
        # Replace Yoko prompt with School Uniform
        # Regex to replace "Yoko \(wearing...)" 
        pass 
        # Actually this is tricky without breaking the string.
        # Let's just do a replace if Yoko is in it.
        # But we need to know WHICH Yoko prompt is currently there.
        # We can just replace the standard Yoko prompt string.
        if "Yoko (" in prompt:
            # Find the Yoko part
            new_prompt = re.sub(r'Yoko \(wearing[^)]+\), (Ref: [^\s]+)?', YOKO_SCHOOL_PROMPT, prompt)
            new_prompt += ", sepia tone, nostalgic atmosphere"
            parts[4] = f" {new_prompt} "
            return "|".join(parts), current_context

    # 3. Handle Michiko
    # If "Michiko" is in subtitle AND it's likely a shot OF her
    if "美智子" in subtitle:
        # Heuristic: If subtitle is describing her appearance or she is talking
        # For now, if "美智子" is explicitly mentioned, let's assume it's a 50/50 chance we want to see her.
        # Or if "彼女" (She) is used in specific chapters.
        # Let's look for "美智子は" (Michiko is/did...) -> Good indicator of subject.
        if "美智子は" in subtitle or "美智子さん" in subtitle or "彼女は" in subtitle:
             # Replace Yoko with Michiko
             if "Yoko (" in prompt:
                 new_prompt = re.sub(r'Yoko \(wearing[^)]+\), (Ref: [^\s]+)?', MICHIKO_PROMPT, prompt)
                 parts[4] = f" {new_prompt} "
    
    return "|".join(parts), current_context

def main():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    refined_lines = []
    context = "Scenery, poetic atmosphere"
    
    for line in lines:
        new_line, context = refine_line(line, context)
        refined_lines.append(new_line)
        
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.writelines(refined_lines)
        
    print(f"Refined plan saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
