import json
import re

# 現在のマニフェスト
with open(r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\keiko-mitsuko-story\audio_manifest.json", "r", encoding="utf-8") as f:
    m = json.load(f)
print(f"audio_manifest.json: {len(m)} entries")

# manifest_final
with open(r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\keiko-mitsuko-story\manifest_final.json", "r", encoding="utf-8") as f:
    mf = json.load(f)
print(f"manifest_final.json: {len(mf)} entries")

# 元ファイルから字幕を全て抽出
files = [
    r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\projects\reincarnation_story\prompts_ch1.md",
    r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\projects\reincarnation_story\prompts_ch2.md",
    r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\projects\reincarnation_story\prompts_ch3.md",
    r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\projects\reincarnation_story\prompts_ch4_to_ch7.md",
]
all_subs = {}
for fp in files:
    with open(fp, "r", encoding="utf-8") as f:
        content = f.read()
    pairs = re.findall(r"ID:\s*(sc_\d+)\s*\n字幕内容:\s*(.+)", content)
    for sid, sub in pairs:
        all_subs[sid] = sub.strip()
    print(f"  {fp.split(chr(92))[-1]}: {len(pairs)} scenes")

print(f"\nTotal scenes in source files: {len(all_subs)}")

# マニフェストと比較
man_subs = {}
for item in m:
    man_subs[item["id"]] = item["subtitle"]

mismatches = []
missing = []
for sid in sorted(all_subs.keys(), key=lambda x: int(re.search(r"\d+", x).group())):
    if sid not in man_subs:
        missing.append(sid)
    elif all_subs[sid] != man_subs[sid]:
        mismatches.append(sid)

print(f"Missing from manifest: {len(missing)}")
for sid in missing:
    print(f"  {sid}: {all_subs[sid][:60]}")

print(f"\nMismatched text: {len(mismatches)}")
for sid in mismatches:
    print(f"  {sid}:")
    print(f"    SRC: {all_subs[sid][:80]}")
    print(f"    MAN: {man_subs[sid][:80]}")
