import re
import os

INPUT_SCRIPT = r'video/public/assets/narration_script.md'
OUTPUT_PROMPTS = r'video/public/assets/all_chapters_prompts_217.md'

# Character Definitions
YOKO_PROMPT = "[Yoko: 60s, silver-gray bob hair, beige cardigan]"
MICHIKO_PROMPT = "[Michiko: 60s, rose-pink top, pearl necklace]"
STYLE_PROMPT = "Kyoto Animation style, cinematic lighting, emotional and delicate line art, 8k resolution"

def main():
    with open(INPUT_SCRIPT, 'r', encoding='utf-8') as f:
        content = f.read()

    output = "# All Chapters Prompts (217 Scenes) - Japanese Semantic Match\n\n"
    output += "## Config\n"
    output += f"- Style: {STYLE_PROMPT}\n"
    output += f"- Yoko: {YOKO_PROMPT}\n"
    output += f"- Michiko: {MICHIKO_PROMPT}\n\n"

    parts = re.split(r'## Chapter (\d+)', content)

    for i in range(1, len(parts), 2):
        ch_num = parts[i]
        text_chunk = parts[i+1]
        
        output += f"## Chapter {ch_num}\n\n"
        
        lines = text_chunk.strip().split('\n')
        for line in lines:
            if not line.strip(): continue
            match = re.match(r'(ch\d+_sc\d+): (.*)', line)
            if match:
                sid = match.group(1)
                text = match.group(2)
                
                # Determine Character
                char_prompt = YOKO_PROMPT # Default
                if "美智子" in text:
                    char_prompt = MICHIKO_PROMPT
                    if "陽子" in text:
                        char_prompt = f"{YOKO_PROMPT}, {MICHIKO_PROMPT}"
                elif "陽子" not in text and ("花" in text or "空" in text or "時計" in text or "スマホ" in text or "カップ" in text):
                    # Guess for object-only scenes (imperfect but better than always Yoko)
                    # If heavily abstract, maybe No human?
                    # Let's stick to Yoko as default POV unless it's clearly an object.
                    pass
                
                # Construct Prompt
                # We include the Japanese text directly to guide the mood/action
                final_prompt = f"{STYLE_PROMPT}, {char_prompt}, [{text}], [Emotional, Atmospheric, Anime Key Visual], --ar 16:9"
                
                output += f"### {sid}\n"
                output += f"Script: {text}\n"
                output += f"Final_Prompt: {final_prompt}\n\n"

    with open(OUTPUT_PROMPTS, 'w', encoding='utf-8') as f:
        f.write(output)
    
    print(f"Generated {OUTPUT_PROMPTS}")

if __name__ == "__main__":
    main()
