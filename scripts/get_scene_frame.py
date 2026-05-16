import json

TARGET_ID = "ch1_sc26"
MANIFEST_PATH = "video/src/manifest.json"
FPS = 30

with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

current_frame = 0
found = False

for item in data:
    duration_frames = int(item['duration'] * FPS) # Start frame calculation might need ceil/floor logic matching StoryComposition
    # In StoryComposition: Math.ceil(item.duration * FPS)
    import math
    duration_frames = math.ceil(item['duration'] * FPS)
    
    if item['id'] == TARGET_ID:
        print(f"Start Frame for {TARGET_ID}: {current_frame}")
        print(f"Duration Frames: {duration_frames}")
        # Target middle of the scene
        print(f"Middle Frame: {current_frame + duration_frames // 2}")
        found = True
        break
    
    current_frame += duration_frames

if not found:
    print("Scene not found")
