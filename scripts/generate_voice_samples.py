import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

# Configuration
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
OUTPUT_DIR = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\samples'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Sample Text (Ch1 Sc01)
TEXT = "六十五歳になって知ったのは、朝の静寂がいかに贅沢な果実であるかということだ。"

# Voice Candidates
CANDIDATES = [
    {
        "name": "sample_A",
        "label": "Pattern A (Mature: Neural2-B, Pitch -2.0)",
        "voice_name": "ja-JP-Neural2-B",
        "pitch": -2.0,
        "speaking_rate": 0.95
    },
    {
        "name": "sample_B",
        "label": "Pattern B (Elderly: Neural2-B, Pitch -4.0)",
        "voice_name": "ja-JP-Neural2-B",
        "pitch": -4.0,
        "speaking_rate": 0.90
    },
    {
        "name": "sample_C",
        "label": "Pattern C (Soft: Standard-B, Pitch -1.0)",
        "voice_name": "ja-JP-Standard-B",
        "pitch": -1.0,
        "speaking_rate": 0.95
    }
]

def generate_samples():
    if not API_KEY:
        print("Error: API_KEY not found.")
        return

    # Use API Key with discovery service
    service = build('texttospeech', 'v1', developerKey=API_KEY)

    print(f"Generating samples to {OUTPUT_DIR}...")

    for cand in CANDIDATES:
        print(f"  Generating {cand['name']} ({cand['label']})...")
        
        input_text = {'text': TEXT}
        voice = {'languageCode': 'ja-JP', 'name': cand['voice_name']}
        audio_config = {
            'audioEncoding': 'MP3',
            'pitch': cand['pitch'],
            'speakingRate': cand['speaking_rate']
        }

        try:
            response = service.text().synthesize(
                body={
                    'input': input_text,
                    'voice': voice,
                    'audioConfig': audio_config
                }
            ).execute()

            # The response's audioContent is base64-encoded.
            audio_content = response['audioContent']
            
            # Save file
            filename = f"{cand['name']}.mp3"
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            with open(filepath, 'wb') as out:
                out.write(base64.b64decode(audio_content))
                print(f"    Saved: {filepath}")

        except Exception as e:
            print(f"    Error: {e}")

    print("Done.")

import base64

if __name__ == "__main__":
    generate_samples()
