import os
import re
import json
import requests
import base64
import time

# ============================================================
# 台本全文 → 細分化シーン生成スクリプト
#
# 方針:
# 1. composition_plan.mdの96シーン字幕を「アンカー」として使用
# 2. full_script.txtの全文を、アンカー間のテキストとして区分
# 3. 長い区間は2〜3文ずつに分割してサブシーン化
# 4. 各サブシーンは元のシーンの画像を使い回し
# 5. Ken Burns効果のパラメータを自動で変化させる
# ============================================================

API_KEY = "AIzaSyCB93b_Nja2G1evVeuTruTj3lOGjXht8AM"
URL = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={API_KEY}"

FULL_SCRIPT = r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\projects\reincarnation_story\full_script.txt"
COMP_PLAN = r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\projects\reincarnation_story\composition_plan.md"
AUDIO_OUT_DIR = r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\audio"
IMAGE_DIR = r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\keiko-mitsuko-story"
MANIFEST_OUT = r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\keiko-mitsuko-story\audio_manifest.json"
os.makedirs(AUDIO_OUT_DIR, exist_ok=True)

# 音声プロファイル
KEIKO   = {"name": "ja-JP-Neural2-B", "pitch": -2.0,  "speakingRate": 1.0}
MITSUKO = {"name": "ja-JP-Neural2-B", "pitch": -8.0,  "speakingRate": 1.15}
SATO    = {"name": "ja-JP-Neural2-C", "pitch": 0.0,   "speakingRate": 1.1}
SHITEN  = {"name": "ja-JP-Neural2-D", "pitch": -1.0,  "speakingRate": 0.95}

# Ken Burnsバリエーション（同一画像内でカメラワークを変える）
KB_VARIANTS = [
    {"fromScale": 1.0, "toScale": 1.08, "panX": 0, "panY": 0},       # ゆっくりズームイン（中央）
    {"fromScale": 1.05, "toScale": 1.0, "panX": 0, "panY": 0},       # ゆっくりズームアウト
    {"fromScale": 1.0, "toScale": 1.06, "panX": -30, "panY": 0},     # 左へパン＋微ズーム
    {"fromScale": 1.0, "toScale": 1.06, "panX": 30, "panY": 0},      # 右へパン＋微ズーム
    {"fromScale": 1.0, "toScale": 1.06, "panX": 0, "panY": -20},     # 上へパン＋微ズーム
    {"fromScale": 1.03, "toScale": 1.1, "panX": -15, "panY": -10},   # 左上へパン＋ズーム
]


def determine_speaker(text):
    """テキスト内容から話者を判定"""
    # カギカッコのセリフを検出
    if "「" in text and "」" in text:
        dialogue = re.findall(r'「([^」]+)」', text)
        for d in dialogue:
            if "恵子さんも大変" in d or "物価高" in d:
                return MITSUKO
            if "あら、相変わらず" in d or "壊れていなかった" in d:
                return MITSUKO
            if "いいわよ、そんな安物" in d or "喉が荒れ" in d:
                return MITSUKO
            if "貧乏臭い" in d or "負け犬" in d or "インフレの時代" in d:
                return MITSUKO
            if "な、何を言ってる" in d or "エステに旅行" in d:
                return MITSUKO
            if "恵子、お願い" in d or "あなたしかいない" in d:
                return MITSUKO
            if "息子が" in d and "闇金" in d:
                return MITSUKO
            if "二億円" in d and "消される" in d:
                return MITSUKO
            if "お金持っている" in d or "友達でしょ" in d or "見捨てる" in d:
                return MITSUKO
            if "あの子が最後に残した" in d:
                return MITSUKO
            if "わかったわ" in d and "命が助かる" in d:
                return MITSUKO
            if "返して。お願い" in d:
                return MITSUKO
            if "嘘よ。あんなに高かった" in d:
                return MITSUKO
            if "私を憎んでいる" in d:
                return MITSUKO
            if "冷たいのね" in d or "よしみ" in d:
                return MITSUKO
            if "柏木さん、お久しぶり" in d or "隠居" in d:
                return SATO
            if "話にならない" in d or "息子さんの命" in d or "まとめて頂戴" in d:
                return SATO
            if "支店長、ちょうどいい" in d or "老婆の債務不履行" in d:
                return SATO
            if "何を言ってるんだ" in d or "こいつはただの" in d:
                return SATO
            if "個人が、あんな巨大ファンド" in d:
                return SATO
            if "柏木様。お待ち" in d:
                return SHITEN
            if "言葉を慎みなさい" in d or "別格の存在" in d:
                return SHITEN
            if "ボロ家で腐って" in d:
                return MITSUKO
            if "どうして、そんなこと" in d:
                return MITSUKO
            if "あなた、本当は何者" in d:
                return MITSUKO
            if "止められるの" in d:
                return MITSUKO
    return KEIKO


def synthesize_audio(text, profile, out_path, force=False):
    if os.path.exists(out_path) and not force:
        return True
    clean = text.replace("<br>", "").replace("</br>", "")
    payload = {
        "input": {"text": clean},
        "voice": {"languageCode": "ja-JP", "name": profile["name"]},
        "audioConfig": {
            "audioEncoding": "MP3",
            "pitch": profile["pitch"],
            "speakingRate": profile["speakingRate"]
        }
    }
    try:
        resp = requests.post(URL, json=payload)
        resp.raise_for_status()
        audio = base64.b64decode(resp.json()["audioContent"])
        with open(out_path, "wb") as f:
            f.write(audio)
        return True
    except Exception as e:
        print(f"  ❌ API Error: {e}")
        return False


def find_image_for_scene(scene_num):
    """シーン番号に対応する画像ファイルを検索"""
    prefix = f"sc_{scene_num:02d}_"
    for fname in os.listdir(IMAGE_DIR):
        if fname.startswith(prefix) and (fname.endswith(".png") or fname.endswith(".jpg")):
            return f"assets/keiko-mitsuko-story/{fname}"
    return None


def split_into_sentences(text):
    """テキストを文単位に分割"""
    # 。で分割しつつ、カギカッコ内の。は分割しない
    sentences = []
    current = ""
    in_quote = False
    for ch in text:
        current += ch
        if ch == "「":
            in_quote = True
        elif ch == "」":
            in_quote = False
        elif ch == "。" and not in_quote:
            s = current.strip()
            if s:
                sentences.append(s)
            current = ""
    if current.strip():
        sentences.append(current.strip())
    return sentences


def group_sentences(sentences, max_chars=120):
    """文をグループ化（1グループ = 1サブシーン、max_chars文字程度）"""
    groups = []
    current_group = []
    current_len = 0
    for s in sentences:
        if current_len + len(s) > max_chars and current_group:
            groups.append("".join(current_group))
            current_group = [s]
            current_len = len(s)
        else:
            current_group.append(s)
            current_len += len(s)
    if current_group:
        groups.append("".join(current_group))
    return groups


# ============================================================
# メイン処理
# ============================================================
print("=" * 60)
print("台本全文 → 細分化シーン生成")
print("=" * 60)

# 1. composition_plan.mdから96シーンのアンカー字幕を取得
with open(COMP_PLAN, "r", encoding="utf-8") as f:
    plan_content = f.read()
anchors = []
pattern = r'\|\s*(sc_\d+)\s*\|\s*[^|]*\|\s*([^|]+)\|\s*[^|]*\|'
for m in re.finditer(pattern, plan_content):
    sid = m.group(1).strip()
    sub = m.group(2).strip().replace("<br>", "")
    num = int(re.search(r'\d+', sid).group())
    anchors.append({"id": sid, "num": num, "subtitle_clean": sub})
print(f"アンカーシーン数: {len(anchors)}")

# 2. full_script.txtの全文を読み込み
with open(FULL_SCRIPT, "r", encoding="utf-8") as f:
    full_text = f.read()

# 章タイトル行を除去
full_text = re.sub(r'^第\d+章：.+$', '', full_text, flags=re.MULTILINE).strip()

# 3. アンカーの位置を特定（字幕テキストの最初の部分で検索）
for anchor in anchors:
    clean = anchor["subtitle_clean"]
    # 最初の20文字程度で検索（完全一致ではなく部分一致）
    search_key = clean[:min(15, len(clean))]
    pos = full_text.find(search_key)
    anchor["pos"] = pos
    if pos == -1:
        print(f"  ⚠️ アンカー未発見: {anchor['id']} -> {search_key}")

# 位置順でソート
anchors_sorted = sorted([a for a in anchors if a["pos"] >= 0], key=lambda x: x["pos"])

# 4. アンカー間のテキストを抽出し、サブシーンに分割
all_segments = []
for i, anchor in enumerate(anchors_sorted):
    start_pos = anchor["pos"]
    if i + 1 < len(anchors_sorted):
        end_pos = anchors_sorted[i + 1]["pos"]
    else:
        end_pos = len(full_text)
    
    segment_text = full_text[start_pos:end_pos].strip()
    if not segment_text:
        continue
    
    # 文に分割してグループ化
    sentences = split_into_sentences(segment_text)
    groups = group_sentences(sentences, max_chars=120)
    
    image_path = find_image_for_scene(anchor["num"])
    if not image_path:
        print(f"  ⚠️ 画像なし: {anchor['id']}")
        continue
    
    for j, group_text in enumerate(groups):
        kb = KB_VARIANTS[j % len(KB_VARIANTS)]
        all_segments.append({
            "scene_id": anchor["id"],
            "sub_index": j,
            "text": group_text,
            "image": image_path,
            "kenburns": kb,
        })

print(f"総セグメント数: {len(all_segments)}")

# 5. 音声生成とマニフェスト作成
manifest = []
for idx, seg in enumerate(all_segments):
    seg_id = f"{seg['scene_id']}_{chr(97 + seg['sub_index'])}"  # sc_01_a, sc_01_b, ...
    audio_filename = f"{seg_id}_audio.mp3"
    audio_path = os.path.join(AUDIO_OUT_DIR, audio_filename)
    
    profile = determine_speaker(seg["text"])
    speaker_names = {KEIKO["name"][-1]: "恵子", MITSUKO["name"][-1]: "恵子", SATO["name"][-1]: "佐藤", SHITEN["name"][-1]: "支店長"}
    
    print(f"  [{idx+1}/{len(all_segments)}] {seg_id}: {seg['text'][:40]}...")
    
    success = synthesize_audio(seg["text"], profile, audio_path, force=True)
    
    if success:
        manifest.append({
            "id": seg_id,
            "subtitle": seg["text"],
            "audio": f"assets/audio/{audio_filename}",
            "image": seg["image"],
            "speaker": profile["name"][-1],
            "kenburns": seg["kenburns"]
        })
    
    time.sleep(0.08)

# 6. マニフェスト保存
with open(MANIFEST_OUT, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"\n{'=' * 60}")
print(f"✅ 全 {len(manifest)} セグメントの処理完了")
print(f"   マニフェスト: {MANIFEST_OUT}")
print(f"{'=' * 60}")
