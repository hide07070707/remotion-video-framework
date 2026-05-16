import json
import os

MANIFEST_PATH = r'video/src/manifest.json'
OUTPUT_JSONL = r'video/batch_requests.jsonl'

# Style Prompt
STYLE_PROMPT = (
    "Anime art style, Kyoto Animation (KyoAni) quality, soft emotional lighting, "
    "highly detailed, 4k resolution, cinematic composition. "
    "Character: Yoko, an elegant 65-year-old Japanese woman, silver hair in a neat bob, "
    "gentle face with subtle wrinkles, wearing simple, high-quality mature clothing. "
    "Atmosphere: Melancholic but beautiful, quiet everyday life. "
    "Scene Context: "
)

def create_batch_file():
    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found: {MANIFEST_PATH}")
        return

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        items = json.load(f)

    print(f"Creating batch requests for {len(items)} scenes...")

    with open(OUTPUT_JSONL, 'w', encoding='utf-8') as out:
        for item in items:
            scene_id = item['id']
            text = item['text']
            # Prompt
            full_prompt = f"{STYLE_PROMPT} {text}"

            # Construct Request Object
            # Standard Batch format for Google GenAI
            request_body = {
                "custom_id": scene_id,
                "request": {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{"text": full_prompt}]
                        }
                    ],
                    "generationConfig": {
                        "responseModalities": ["IMAGE"]
                     }
                }
            }
            
            out.write(json.dumps(request_body) + "\n")

    print(f"Successfully wrote {OUTPUT_JSONL}")

if __name__ == "__main__":
    create_batch_file()
