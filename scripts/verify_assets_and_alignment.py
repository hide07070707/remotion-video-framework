import os
import json


# Paths
PROJECT_ROOT = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video'
MANIFEST_PATH = os.path.join(PROJECT_ROOT, 'src', 'manifest.json')
ASSETS_DIR = os.path.join(PROJECT_ROOT, 'public', 'assets')

def check_file_exists(path):
    return os.path.exists(path)

def main():
    output_lines = []
    output_lines.append(f"{'ID':<10} | {'Image Match':<12} | {'Audio Match':<12} | {'Text Prefix (15 chars)':<25}")
    output_lines.append("-" * 65)

    try:
        with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
    except Exception as e:
        print(f"Error loading manifest: {e}")
        return

    alignment_errors = []

    # Iterate through all expected 100 segments
    for chapter in range(1, 6):
        for scene in range(1, 21):
            scene_id = f"ch{chapter}_sc{scene:02d}"
            
            # Find in manifest
            item = next((i for i in manifest if i['id'] == scene_id), None)
            
            if not item:
                output_lines.append(f"{scene_id:<10} | {'MISSING IN MANIFEST':<40}")
                alignment_errors.append(f"{scene_id}: Missing from manifest")
                continue

            # Verify Image
            image_filename = f"{scene_id}.png"
            image_path = os.path.join(ASSETS_DIR, f"chapter{chapter}", image_filename)
            image_exists = check_file_exists(image_path)
            image_status = "OK" if image_exists else "MISSING"

            # Verify Audio
            audio_rel_path = item.get('file', '')
            audio_path = os.path.join(PROJECT_ROOT, 'public', audio_rel_path.replace('/', os.sep))
            audio_exists = check_file_exists(audio_path)
            audio_status = "OK" if audio_exists else "MISSING"

            # Text
            text = item.get('text', '')
            text_preview = text[:15].replace('\n', ' ')

            output_lines.append(f"{scene_id:<10} | {image_status:<12} | {audio_status:<12} | {text_preview:<25}")

            if not image_exists:
                alignment_errors.append(f"{scene_id}: Image missing at {image_path}")
            if not audio_exists:
                alignment_errors.append(f"{scene_id}: Audio missing at {audio_path}")

    output_lines.append("\n" + "="*30)
    output_lines.append("VERIFICATION SUMMARY")
    output_lines.append("="*30)
    if alignment_errors:
        output_lines.append(f"FAILED: Found {len(alignment_errors)} errors.")
        for err in alignment_errors:
            output_lines.append(f" - {err}")
    else:
        output_lines.append("SUCCESS: All 100 segments have matching Manifest entry, Image file, and Audio file.")

    with open('verification_report.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))
    print("Report saved to verify_assets_and_alignment.txt")

if __name__ == "__main__":
    main()
