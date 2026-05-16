import json
import re
import os

# Configuration
INPUT_FILE = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\all_chapters_prompts_217.md'
OUTPUT_FILE = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\batch_requests_217.jsonl'
REF_URIS_FILE = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\ref_uris.json'
MODEL_ID = "gemini-3-pro-image-preview" 

def load_ref_uris():
    if not os.path.exists(REF_URIS_FILE):
        print(f"Warning: {REF_URIS_FILE} not found. Skipping refs.")
        return {}
    with open(REF_URIS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def should_process(chapter_num, scene_num):
    return True

def parse_markdown(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = re.compile(r'### (ch(\d+)_sc(\d+)).*?Final_Prompt:\s*(.*?)(?=\n###|\n##|\Z)', re.DOTALL)
    matches = pattern.findall(content)
    
    requests = []
    ref_uris = load_ref_uris()
    
    michiko_uri = ref_uris.get("Michiko", {}).get("uri")
    yoko_uri = ref_uris.get("Yoko", {}).get("uri")

    print(f"Found {len(matches)} total prompts in markdown.")
    
    count = 0
    for full_match in matches:
        full_id = full_match[0]
        ch_str = full_match[1]
        sc_str = full_match[2]
        prompt_text = full_match[3]
        
        ch_num = int(ch_str)
        sc_num = int(sc_str)
        
        if should_process(ch_num, sc_num):
            cleaned_prompt = prompt_text.strip().replace('\n', ' ')
            
            # Inject URI into --cref if available
            # Note: We replace the local path with the remote URI
            curr_uri = None
            if "Michiko" in cleaned_prompt:
                curr_uri = michiko_uri
            elif "Yoko" in cleaned_prompt:
                curr_uri = yoko_uri
                
            if curr_uri:
                 # Regex to find --cref followed by path (until space or end)
                 # We simply replace the existing --cref ... with --cref URI
                 if "--cref" in cleaned_prompt:
                     cleaned_prompt = re.sub(r'--cref\s+[^\s]+', f'--cref {curr_uri}', cleaned_prompt)
                 else:
                     # If no --cref but matches keyword, append it
                     cleaned_prompt += f" --cref {curr_uri} --cw 10"

            request = {
                "custom_id": full_id,
                "method": "POST",
                "url": f"/v1beta/models/{MODEL_ID}:generateContent",
                "body": {
                    "contents": {
                        "role": "user",
                        "parts": [{"text": cleaned_prompt}] 
                    }
                }
            }
            requests.append(request)
            count += 1
            
    print(f"Processed {count} valid requests (Ch3_Sc05+).")
    return requests

def save_jsonl(requests, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        for req in requests:
            f.write(json.dumps(req) + '\n')
    print(f"Saved {len(requests)} requests to {output_path}")

if __name__ == "__main__":
    if not os.path.exists(INPUT_FILE):
        print(f"Error: Input file output found at {INPUT_FILE}")
    else:
        reqs = parse_markdown(INPUT_FILE)
        save_jsonl(reqs, OUTPUT_FILE)
