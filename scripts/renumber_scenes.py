import re
import os

INPUT_FILE = r'video/public/assets/narration_script.md'

def renumber_script():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    current_chapter = 0
    scene_counter = 1

    header_pattern = re.compile(r'## Chapter (\d+)')
    scene_pattern = re.compile(r'ch\d+_sc\d+:\s*(.*)')

    for line in lines:
        line = line.strip()
        if not line:
            new_lines.append("")
            continue

        # Check for Chapter Header
        header_match = header_pattern.match(line)
        if header_match:
            current_chapter = int(header_match.group(1))
            scene_counter = 1
            new_lines.append(line)
            continue

        # Check for Scene Line
        scene_match = scene_pattern.match(line)
        if scene_match:
            content = scene_match.group(1)
            # Reconstruct with correct ID
            new_id = f"ch{current_chapter}_sc{scene_counter:02d}"
            new_lines.append(f"{new_id}: {content}")
            scene_counter += 1
        else:
            # Preserve other lines (comments, etc)
            new_lines.append(line)

    # Write back
    with open(INPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))

    print(f"Script renumbered successfully. processed {len(new_lines)} lines.")

if __name__ == "__main__":
    renumber_script()
