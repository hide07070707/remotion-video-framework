import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
client = genai.Client(api_key=API_KEY)

ASSETS_DIR = r'video/public/assets'
REF_IMAGES = {
    'yoko': 'ref_yoko.png',
    'michiko': 'ref_michiko.png'
}

def upload_refs():
    uris = {}
    for name, filename in REF_IMAGES.items():
        path = os.path.join(ASSETS_DIR, filename)
        if os.path.exists(path):
            print(f"Uploading {filename}...")
            try:
                # Upload using genai SDK
                file_obj = client.files.upload(path=path)
                print(f"  Uploaded: {file_obj.uri}")
                uris[filename] = file_obj.uri
            except Exception as e:
                print(f"  Failed: {e}")
        else:
            print(f"  Missing local file: {path}")
    
    return uris

if __name__ == "__main__":
    new_uris = upload_refs()
    print("NEW_URIS:", new_uris)
    with open('new_ref_uris.json', 'w') as f:
        import json
        json.dump(new_uris, f)
