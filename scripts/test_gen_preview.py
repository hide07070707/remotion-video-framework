import os
import base64
import google.genai
from PIL import Image
import io
from dotenv import load_dotenv

# Try loading from current directory explicitly
load_dotenv('.env')

# Configuration
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
OUTPUT_DIR = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\previews'
REF_IMAGE_PATH = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\characters\yoko_master.png'

# Prompts from all_chapters_prompts_v2.md
PROMPTS = {
    "ch1_sc01": "Kyoto Animation style, cinematic lighting, emotional and delicate line art, 8k resolution, [Yoko: 60s, silver-gray bob hair, beige cardigan], [六十五歳になって知ったのは、], [Emotional, Atmospheric, Anime Key Visual], --ar 16:9"
}

def generate_previews():
    if not API_KEY:
        print("Error: GEMINI_API_KEY not set.")
        return

    client = google.genai.Client(api_key=API_KEY)

    # Load Reference Image
    try:
        with open(REF_IMAGE_PATH, "rb") as f:
            ref_image_bytes = f.read()
        ref_image_b64 = base64.b64encode(ref_image_bytes).decode('utf-8')
        print(f"Loaded reference image: {REF_IMAGE_PATH}")
    except Exception as e:
        print(f"Error loading reference image: {e}")
        return

    for sc_id, prompt_text in PROMPTS.items():
        print(f"\nGenerating {sc_id}...")
        try:
            # Use Imagen 3 model for generation
            # Syntax for google-genai SDK for image generation:
            # client.models.generate_images(model='imagen-3.0-generate-001', prompt=...)
            
            print(f"Generating preview for {sc_id} with 'gemini-3-pro-image-preview' (Text + Cref URI)...")
            
            parts = [{"text": prompt_text}]
            
            # Yoko Cref URI (Hardcoded for test)
            YOKO_URI = "https://generativelanguage.googleapis.com/v1beta/files/gpxll0jaorej"
            
            if sc_id == "ch1_sc01":
                parts.append({
                    "file_data": {"mime_type": "image/png", "file_uri": YOKO_URI}
                })
            
            # Convert dict parts to types.Part if needed or use dictionary if supported by SDK helpers?
            # The SDK usually expects types.Content(parts=[types.Part.from_...]) OR dicts if using raw client.
            # But here we are using `client.models.generate_content`.
            # We can pass a list of Part objects.
            
            real_parts = [google.genai.types.Part.from_text(text=prompt_text)]
            if sc_id == "ch1_sc01":
                 # How to create Part from URI?
                 # types.Part(file_data=types.FileData(file_uri=..., mime_type=...))
                 real_parts.append(
                     google.genai.types.Part(
                         file_data=google.genai.types.FileData(
                             file_uri=YOKO_URI, 
                             mime_type="image/png"
                         )
                     )
                 )
            
            response = client.models.generate_content(
                model='gemini-3-pro-image-preview',
                contents=[google.genai.types.Content(parts=real_parts)]
            )

            # Check output
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        print(f"Found inline data! Mime: {part.inline_data.mime_type}")
                        img_data = base64.b64decode(part.inline_data.data)
                        save_path = os.path.join(OUTPUT_DIR, f"{sc_id}.png")
                        with open(save_path, "wb") as f:
                            f.write(img_data)
                        print(f"Saved to {save_path}")
                        return # Exit after one success
                    
                    if part.text:
                        print(f"Text part: {part.text[:50]}...")
            else:
                print("No candidates returned.")

        except Exception as e:
            print(f"Error generating {sc_id}: {e}")

if __name__ == "__main__":
    generate_previews()
