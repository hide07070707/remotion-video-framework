import json
import re
import os

# Configuration
INPUT_FILE = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\prompt_list_217.txt'
OUTPUT_FILE = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\batch_ch1.jsonl'
MODEL_ID = "models/gemini-2.0-flash-exp" # Nano Banana Pro

def prepare_batch():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to capture File ID and Prompt
    # Expecting: [File: ch1_sc01.png]
    # Prompt: ...
    pattern = re.compile(r'\[File: (ch1_sc\d+)\.png\]\s+Prompt: (.*?)(?=\n\[File:|\Z)', re.DOTALL)
    matches = pattern.findall(content)

    print(f"Found {len(matches)} prompts for Chapter 1.")

    requests = []
    
    for match in matches:
        file_id = match[0] # e.g. ch1_sc01
        prompt_text = match[1].strip()
        
        # Append negative prompt
        final_prompt = prompt_text + " Do not render any text, subtitles, or letters."
        
        request = {
            "custom_id": file_id,
            "method": "POST",
            "url": f"/v1beta/{MODEL_ID}:generateContent",
            "body": {
                "contents": {
                    "role": "user",
                    "parts": [{"text": final_prompt}]
                },
                "generation_config": {
                    "response_mime_type": "image/jpeg"
                }
            }
        }
        requests.append(request)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        for req in requests:
            f.write(json.dumps(req) + '\n')
            
    print(f"Saved {len(requests)} requests to {OUTPUT_FILE}")

if __name__ == "__main__":
    prepare_batch()
