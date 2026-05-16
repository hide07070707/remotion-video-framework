import os
import re
import requests
import base64
import json
import time

# ============================================================
# 音声一括生成スクリプト（最終修正版）
# 
# ★唯一の入力ソース: composition_plan.md（全96シーンの正本）
# ★LLMは一切使用しない
# ★正規表現による純粋な文字列処理のみ
# ============================================================

API_KEY = "AIzaSyCB93b_Nja2G1evVeuTruTj3lOGjXht8AM"
URL = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={API_KEY}"

# ★★★ 唯一の正しい入力ファイル（正本）★★★
SOURCE_FILE = r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\projects\reincarnation_story\composition_plan.md"

AUDIO_OUT_DIR = r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\audio"
MANIFEST_OUT_PATH = r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\keiko-mitsuko-story\audio_manifest.json"
os.makedirs(AUDIO_OUT_DIR, exist_ok=True)

# 音声プロファイル
KEIKO_PROFILE  = {"name": "ja-JP-Neural2-B", "pitch": -2.0, "speakingRate": 1.0}
MITSUKO_PROFILE = {"name": "ja-JP-Neural2-B", "pitch": -8.0, "speakingRate": 1.15}
SATO_PROFILE    = {"name": "ja-JP-Neural2-C", "pitch": 0.0,  "speakingRate": 1.1}
SHITEN_PROFILE  = {"name": "ja-JP-Neural2-D", "pitch": -1.0, "speakingRate": 0.95}  # 支店長

def determine_speaker(char_col):
    """キャラクター列から話者を判定（composition_plan.mdのテーブルにはキャラクター列がある）"""
    char_col = char_col.strip()
    if "佐藤" in char_col:
        return SATO_PROFILE, "佐藤"
    elif "美津子" in char_col:
        return MITSUKO_PROFILE, "美津子"
    elif "支店長" in char_col:
        return SHITEN_PROFILE, "支店長"
    elif "主婦" in char_col:
        return MITSUKO_PROFILE, "主婦"
    else:
        return KEIKO_PROFILE, "恵子"

def synthesize_audio(text, profile, out_filename, force=False):
    out_path = os.path.join(AUDIO_OUT_DIR, out_filename)
    if os.path.exists(out_path) and not force:
        print(f"    (スキップ: 既存ファイルあり)")
        return True

    payload = {
        "input": {"text": text},
        "voice": {"languageCode": "ja-JP", "name": profile["name"]},
        "audioConfig": {
            "audioEncoding": "MP3",
            "pitch": profile["pitch"],
            "speakingRate": profile["speakingRate"]
        }
    }
    try:
        response = requests.post(URL, json=payload)
        response.raise_for_status()
        audio_content = base64.b64decode(response.json()["audioContent"])
        with open(out_path, "wb") as f:
            f.write(audio_content)
        return True
    except Exception as e:
        print(f"    ❌ API エラー: {e}")
        return False


# ============================================================
# メイン処理
# ============================================================
print("=" * 60)
print("全シーン音声一括生成（最終修正版）")
print(f"入力: {SOURCE_FILE}")
print("=" * 60)

with open(SOURCE_FILE, "r", encoding="utf-8") as f:
    content = f.read()

# Markdownテーブルの各行から抽出
# 形式: | sc_XX | キャラクター | 字幕内容 | 演出メモ |
# 正規表現: パイプで区切られた列からID、キャラクター、字幕を取得
pattern = r'\|\s*(sc_\d+)\s*\|\s*([^|]*)\|\s*([^|]+)\|\s*[^|]*\|'
matches = re.findall(pattern, content)

print(f"検出シーン数: {len(matches)}")

if len(matches) != 96:
    print(f"⚠️ 警告: 96シーン期待に対して {len(matches)} シーン検出")

manifest = []

for scene_id, char_col, subtitle_raw in matches:
    scene_id = scene_id.strip()
    subtitle_text = subtitle_raw.strip()
    
    # 字幕テキストをそのまま保持（<br>タグも維持）
    # 音声用はHTMLタグを除去
    clean_text = subtitle_text.replace("<br>", "").replace("</br>", "")
    
    # 話者判定（テーブルのキャラクター列から決定）
    profile, speaker_name = determine_speaker(char_col)
    
    audio_filename = f"{scene_id}_audio.mp3"
    print(f"  🎙️ {scene_id} [{speaker_name}]: {clean_text[:50]}...")
    
    success = synthesize_audio(clean_text, profile, audio_filename, force=True)
    
    if success:
        manifest.append({
            "id": scene_id,
            "subtitle": subtitle_text,
            "audio": f"assets/audio/{audio_filename}",
            "speaker": profile["name"][-1]
        })
    
    time.sleep(0.1)

# IDの数字順にソート
manifest.sort(key=lambda x: int(re.search(r"\d+", x["id"]).group()))

# 保存
with open(MANIFEST_OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"\n{'=' * 60}")
print(f"✅ 全 {len(manifest)} シーンの処理が完了しました")
print(f"   マニフェスト: {MANIFEST_OUT_PATH}")
print(f"{'=' * 60}")

# 検証: 全シーンの字幕を表示
print("\n--- 全シーン字幕一覧（検証用）---")
for item in manifest:
    print(f"  {item['id']}: {item['subtitle'][:70]}")
