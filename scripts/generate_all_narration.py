import os
import re
import json
import base64
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

# Configuration
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
INPUT_FILE = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\narration_script.md'
OUTPUT_BASE = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\audio'

# Voice Settings (Pattern C)
VOICE_NAME = "ja-JP-Standard-B"
PITCH = -1.0
SPEAKING_RATE = 0.95

def parse_markdown_to_segments(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Structure: { chapter_num: { scene_num: text, ... } }
    chapters = {}
    current_chapter = 0

    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Detect Chapter Header
        ch_match = re.match(r'## Chapter (\d+)', line)
        if ch_match:
            current_chapter = int(ch_match.group(1))
            if current_chapter not in chapters:
                chapters[current_chapter] = {}
            continue
            
        # Detect Scene Line: chX_scYY: Text
        match = re.match(r'(ch\d+_sc\d+):\s*(.*)', line)
        if match:
            sc_id = match.group(1)
            text = match.group(2)
            
            # Parse scene number
            try:
                # Expected chX_scYY
                parts = sc_id.split('_sc')
                ch_part = int(parts[0].replace('ch', ''))
                sc_num = int(parts[1])
                
                if ch_part != current_chapter:
                    # Fallback if chapter header was missed or inconsistent, but usually trust ID
                    if ch_part not in chapters: chapters[ch_part] = {}
                    current_chapter = ch_part
                
                chapters[current_chapter][sc_num] = text
            except Exception as e:
                print(f"Skipping malformed ID {sc_id}: {e}")
                
    return chapters

def generate_audio(service, text, output_path):
    if not text.strip():
        print(f"  Skipping empty text for: {output_path}")
        return False

    input_text = {'text': text}
    voice = {'languageCode': 'ja-JP', 'name': VOICE_NAME}
    audio_config = {
        'audioEncoding': 'MP3',
        'pitch': PITCH,
        'speakingRate': SPEAKING_RATE
    }

    try:
        if os.path.exists(output_path):
            print(f"  Skipping (Exists): {output_path}")
            return True

        print(f"  Generating: {output_path}")
        response = service.text().synthesize(
            body={
                'input': input_text,
                'voice': voice,
                'audioConfig': audio_config
            }
        ).execute()

        audio_content = response['audioContent']
        with open(output_path, 'wb') as out:
            out.write(base64.b64decode(audio_content))
        return True

    except Exception as e:
        print(f"  Error generating {output_path}: {e}")
        return False

def main():
    if not API_KEY:
        print("Error: API_KEY not found.")
        return

    service = build('texttospeech', 'v1', developerKey=API_KEY)
    chapters_data = parse_markdown_to_segments(INPUT_FILE)

    print(f"Found {len(chapters_data)} chapters.")

    for ch_num, scenes in chapters_data.items():
        print(f"Processing Chapter {ch_num} ({len(scenes)} segments)...")
        
        # Ensure dir
        ch_dir = os.path.join(OUTPUT_BASE, f"chapter{ch_num}")
        os.makedirs(ch_dir, exist_ok=True)
        
        # Process scenes in order
        sorted_sc_nums = sorted(scenes.keys())
        for sc_num in sorted_sc_nums:
            text = scenes[sc_num]
            sc_id = f"ch{ch_num}_sc{sc_num:02d}"
            filename = f"{sc_id}.mp3"
            path = os.path.join(ch_dir, filename)
            
            generate_audio(service, text, path)

    print("All audio generation complete.")

if __name__ == "__main__":
    main()
