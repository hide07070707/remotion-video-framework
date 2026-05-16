import os
import re
import json
import base64
import google.genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
CLIENT = google.genai.Client(api_key=API_KEY)
REF_URIS_FILE = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\ref_uris.json'
INPUT_FILE = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\all_chapters_prompts_v2.md'

def main():
    # Load Refs
    with open(REF_URIS_FILE, 'r') as f:
        refs = json.load(f)
    print("Refs loaded:", refs)

    # Load Prompts (Just get ch1_sc01)
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex to extract ch1_sc01
    pattern = re.compile(r'### (ch1_sc01)\s+.*?Final_Prompt:\s*(.*?)(?=\n###|\n##|\Z)', re.DOTALL)
    match = pattern.search(content)
    
    if not match:
        print("ch1_sc01 not found!")
        return

    custom_id = match.group(1)
    prompt_text = match.group(2).strip().replace('\n', ' ')
    print(f"Prompt ({custom_id}): {prompt_text[:50]}...")

    # Build Request
    final_parts = [types.Part.from_text(text=prompt_text)]
    
    if "[Yoko" in prompt_text or "Yoko:" in prompt_text:
        uri = refs["Yoko"]["uri"]
        print(f"Adding Yoko URI: {uri}")
        final_parts.append(types.Part(file_data=types.FileData(file_uri=uri, mime_type="image/png")))

    print("Sending request...")
    try:
        response = CLIENT.models.generate_content(
            model='gemini-3-pro-image-preview',
            contents=[types.Content(parts=final_parts)]
        )
        
        print("\nResponse Received!")
        if not response.candidates:
            print("No candidates.")
            return

        cand = response.candidates[0]
        print(f"Finish Reason: {cand.finish_reason}")
        
        if not cand.content.parts:
            print("No parts in content.")
            return

        for i, part in enumerate(cand.content.parts):
            print(f"Part {i}:")
            if part.text:
                print(f"  Text: {part.text[:100]}")
            if part.inline_data:
                print(f"  Inline Data Mime: {part.inline_data.mime_type}")
                raw_data = part.inline_data.data
                print(f"  Data Type: {type(raw_data)}")
                
                # Check if it looks like base64 or bytes
                if isinstance(raw_data, bytes):
                    print(f"  Data is bytes. Len: {len(raw_data)}")
                    # Try saving directly
                    with open("debug_raw.png", "wb") as f:
                        f.write(raw_data)
                    print("  Saved debug_raw.png")
                    
                    # Try decoding if it looks like text
                    try:
                        decoded = base64.b64decode(raw_data)
                        print(f"  Decoded len: {len(decoded)}")
                        with open("debug_decoded.png", "wb") as f:
                            f.write(decoded)
                        print("  Saved debug_decoded.png")
                    except:
                        print("  Decode failed")

                elif isinstance(raw_data, str):
                    print(f"  Data is string. Len: {len(raw_data)}")
                    decoded = base64.b64decode(raw_data)
                    with open("debug_decoded_str.png", "wb") as f:
                        f.write(decoded)
                    print("  Saved debug_decoded_str.png")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    main()
