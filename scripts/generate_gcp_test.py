import os
import requests
import base64

# APIキー設定
API_KEY = "AIzaSyCB93b_Nja2G1evVeuTruTj3lOGjXht8AM"
URL = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={API_KEY}"

# テスト出力先
OUT_DIR = r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\audio\test"
os.makedirs(OUT_DIR, exist_ok=True)

# 恵子のセリフ
KEIKO_TEXT = "ニュースに目が止まった。かつての因縁が忍び寄る予感がした。"
# 美津子のセリフ
MITSUKO_TEXT = "畳にこすれる分厚い化粧。私のプライドが崩れていく…"

# テストパターンの定義
profiles = [
    # 恵子
    {
        "filename": "keiko_1.mp3",
        "text": KEIKO_TEXT,
        "name": "ja-JP-Neural2-B",
        "pitch": -2.0,       # ピッチ少し低め
        "speakingRate": 1.0  # スピード標準
    },
    {
        "filename": "keiko_2.mp3",
        "text": KEIKO_TEXT,
        "name": "ja-JP-Neural2-B",
        "pitch": -4.0,       # ピッチさらに低め
        "speakingRate": 0.9  # スピード少し遅め
    },
    {
        "filename": "keiko_3.mp3",
        "text": KEIKO_TEXT,
        "name": "ja-JP-Neural2-C",
        "pitch": 0.0,        # ピッチ標準
        "speakingRate": 1.0  # スピード標準
    },
    # 美津子
    {
        "filename": "mitsuko_1.mp3",
        "text": MITSUKO_TEXT,
        "name": "ja-JP-Neural2-B", # 女性モデル
        "pitch": -4.0,       # ピッチを限界近くまで下げる
        "speakingRate": 0.9  # ややゆっくり
    },
    {
        "filename": "mitsuko_2.mp3",
        "text": MITSUKO_TEXT,
        "name": "ja-JP-Neural2-B", # 女性モデル
        "pitch": -6.0,       # さらに低いピッチ
        "speakingRate": 1.0  # 標準スピード
    },
    {
        "filename": "mitsuko_3.mp3",
        "text": MITSUKO_TEXT,
        "name": "ja-JP-Neural2-B", # 女性モデル
        "pitch": -8.0,       # 女性の声ギリギリの低さ
        "speakingRate": 1.15 # スピードを少し速めに微調整
    }
]

def synthesize_text(profile):
    payload = {
        "input": {"text": profile["text"]},
        "voice": {
            "languageCode": "ja-JP",
            "name": profile["name"]
        },
        "audioConfig": {
            "audioEncoding": "MP3",
            "pitch": profile["pitch"],
            "speakingRate": profile["speakingRate"]
        }
    }

    try:
        response = requests.post(URL, json=payload)
        response.raise_for_status()
        
        # 音声データの取得とデコード
        audio_content = base64.b64decode(response.json()["audioContent"])
        out_path = os.path.join(OUT_DIR, profile["filename"])
        
        with open(out_path, "wb") as f:
            f.write(audio_content)
        print(f"✅ 生成成功: {profile['filename']}")
        
    except Exception as e:
        print(f"❌ エラー ({profile['filename']}): {e}")
        if response.status_code != 200:
            print(f"Response: {response.text}")

print("Google Cloud TTS 音声生成テストを開始します...")
for p in profiles:
    synthesize_text(p)
print("完了しました！")
