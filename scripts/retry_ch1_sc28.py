import os
import time
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemini-3-pro-image-preview"

OUTPUT_DIR = r'video/public/assets/chapter1'
MASTER_IMAGE_PATH = r'video/public/assets/characters/yoko_master.png'
SCENE_ID = "ch1_sc28"

# Modified safer prompt
PROMPT = "Close up of Yoko's neck and chin area, swallowing in hesitation, elegant lighting, emotional atmosphere"

def retry_sc28():
    if not os.path.exists(MASTER_IMAGE_PATH):
        print("Master image missing")
        return

    print(f"Uploading master image...")
    file_ref = client.files.upload(file=MASTER_IMAGE_PATH, config={'mime_type': 'image/png'})
    
    # Wait for active
    while True:
        f = client.files.get(name=file_ref.name)
        if f.state.name == "ACTIVE":
            break
        time.sleep(1)
        
    print("Generating sc28...")
    
    system_instruction = (
        "RESTRICTION: You must strictly maintain the facial features and clothing of the character 'Yoko' "
        "as shown in the reference image. Do not change her age or hairstyle."
    )
    
    final_prompt = f"{system_instruction}\n\nScene Description: {PROMPT}\n\nNegative Prompt: Do not render any text, subtitles, or letters."
    
    parts = [
        types.Part.from_uri(file_uri=file_ref.uri, mime_type="image/png"),
        types.Part.from_text(text=final_prompt)
    ]
    
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[types.Content(role="user", parts=parts)]
        )
        
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    img_data = part.inline_data.data
                    if isinstance(img_data, str):
                        img_data = base64.b64decode(img_data)
                    
                    output_path = os.path.join(OUTPUT_DIR, f"{SCENE_ID}.png")
                    with open(output_path, "wb") as f:
                        f.write(img_data)
                    print(f"SUCCESS: Saved {SCENE_ID}")
                    return
        print("Failed to get image data.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    retry_sc28()
