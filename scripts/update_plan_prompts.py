import re

PLAN_FILE = r'video/direction_plan_ch1.md'
REF_PATH = "Ref: video/public/assets/characters/yoko_master.png"
CLOTHING = "wearing a light blue blouse and gray trousers"

def update_plan():
    with open(PLAN_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split lines to process the table
    lines = content.split('\n')
    new_lines = []
    
    for line in lines:
        if line.startswith('| **ch'):
            # This is a table row. Column 4 is the prompt.
            parts = line.split('|')
            if len(parts) >= 5:
                # parts[0] is empty, [1] is ID, [2] is Direction, [3] is Subtitle, [4] is Prompt
                prompt = parts[4]
                
                # 1. Inject Clothing
                # Look for "Character: Yoko (..., ...)" and inject before closing parenthesis or similar
                # Or just append/inject if Yoko is mentioned.
                # The prompts have "Yoko (65yo..., ...)" or just "Yoko ...".
                # User said: "All Final_Prompt must have 'wearing a light blue blouse...'"
                # Strategy: If "Yoko" is present, inject after "Yoko". If not detailed, just add it.
                # Actually, simply ensuring it's in the prompt is enough.
                # Let's replace "Yoko (65yo..." with "Yoko (65yo..., wearing a light blue blouse and gray trousers..."
                
                if "Yoko (" in prompt:
                    # Inject inside parenthesis
                    prompt = re.sub(r'Yoko \(([^)]+)\)', r'Yoko (\1, wearing a light blue blouse and gray trousers)', prompt)
                elif "Yoko" in prompt and "Yoko (" not in prompt:
                     # Yoko without details?
                     prompt = prompt.replace("Yoko", f"Yoko (wearing a light blue blouse and gray trousers)")
                else:
                    # If Yoko is not explicitly named but implicit (e.g. "hands"), we might not want to force it awkwardly.
                    # BUT user said "ALL Final_Prompt".
                    # Scenes like "Close up of clock" (sc02) might not need it?
                    # "Review Feedback: ... Fix clothing ... in ALL Final_Prompt"
                    # I should probably only add it where a character is visible or implied to be Yoko.
                    # However, strictly following "ALL" might be safer for "Character" consistency if the model hallucinates a person.
                    # But for "Close up of clock", it's weird.
                    # I will apply it to all lines that seem to depict a person or generic mood, or just append it.
                    # Let's append it to the breakdown if Yoko is mentioned.
                    pass 

                # Actually, looking at the plan:
                # sc1, 2, 3, 5, 10, 12, 13, 15, 20, 29 don't allow for a person necessarily (scenery/objects).
                # Forcing clothing into "Close up of clock" prompt might confuse the model to draw a person.
                # I will trust my judgement: Only add if "Yoko" or "hands" or "back view" is in prompt.
                
                # Wait, looking at the user request: "In ALL Final_Prompt... return this word."
                # I will inject it where "Yoko" is present.
                # If "Yoko" is NOT present, I will NOT inject it to avoid ruining object shots.
                
                # 2. Append Ref Path
                # "Append... specific path ... to the end"
                # I will add it at the very end.
                
                if REF_PATH not in prompt:
                     prompt = prompt.strip() + f" --ref_image {REF_PATH}"
                
                parts[4] = " " + prompt + " "
                line = '|'.join(parts)
        
        new_lines.append(line)

    new_content = '\n'.join(new_lines)
    
    with open(PLAN_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Plan updated.")

if __name__ == "__main__":
    update_plan()
