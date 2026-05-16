import re

INPUT_FILE = r'video/public/assets/narration_script.md'

with open(INPUT_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# Only keep chapter content
parts = re.split(r'## Chapter (\d+)', content)
total_scenes = 0

print("Sample of proposed segmentation (Excerpt):")
print("-" * 40)

for i in range(1, len(parts), 2):
    ch_num = parts[i]
    text_content = parts[i+1]
    
    # Remove existing 'chX_scYY:' prefixes
    text_content = re.sub(r'ch\d+_sc\d+:\s*', '', text_content)
    # Remove newlines for easier splitting
    text_content = text_content.replace('\n', '')
    
    # Split by periods (。) to form sentences
    # Also consider splitting by clear pauses if comma (、) is used heavily?
    # User said "natural breaks (。 or 、)"
    # Let's try splitting by `。` first as the main unit.
    # If a sentence is very long (> 50 chars) and has a `、`, maybe split there too?
    
    segments = []
    # Primitive split by 。
    sentences = re.split(r'(?<=。)', text_content)
    
    for s in sentences:
        s = s.strip()
        if not s: continue
        
        # Further split long sentences by 、 if > 40 chars
        if len(s) > 40 and '、' in s:
            subs = re.split(r'(?<=、)', s)
            segments.extend([sub.strip() for sub in subs if sub.strip()])
        else:
            segments.append(s)
            
    print(f"Chapter {ch_num}: {len(segments)} scenes")
    total_scenes += len(segments)
    
    # Print first few for check
    for j, seg in enumerate(segments[:3]):
        print(f"  {j+1}. {seg}")
    print("  ...")

print("-" * 40)
print(f"Total Estimated Scenes: {total_scenes}")
