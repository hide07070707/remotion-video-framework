import json
import os
import requests

# 1. APIキーの読み込み
config_path = r"c:\Users\suppo\.gemini\antigravity\mcp_config.json"
try:
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    api_key = config['mcpServers']['elevenlabs-mcp']['env']['ELEVENLABS_API_KEY']
except Exception as e:
    print(f"APIキーの読み込みに失敗しました: {e}")
    exit(1)

# 2. テスト音声の生成 (権限エラー回避のため既知のVoice IDを直接指定)
voice_ids = {
    "1": {"id": "ThT5KcBeYPX3keUQqHPh", "name": "Dorothy", "desc": "落ち着いた深い声"},
    "2": {"id": "EXAVITQu4vr4xnSDxMaL", "name": "Bella", "desc": "少し高めの優しい声"},
    "3": {"id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "desc": "凛とした知的な声"}
}

print("選択されたボイス:", voice_ids)

# 3. テスト音声の生成
text = "私の年金は、月十二万円。けれど、人差し指一本で、誰かの一生を買い上げることもできる。"
output_dir = r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets\audio"
os.makedirs(output_dir, exist_ok=True)

for key, v_info in voice_ids.items():
    if not v_info:
        continue
    
    print(f"生成中: test_keiko_{key}.mp3 ({v_info['name']} - {v_info['desc']})")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{v_info['id']}"
    
    headers_post = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.2, # 若干の感情表現を加える
            "use_speaker_boost": True
        }
    }
    
    response = requests.post(url, json=data, headers=headers_post)
    if response.status_code == 200:
        output_path = os.path.join(output_dir, f"test_keiko_{key}.mp3")
        with open(output_path, 'wb') as f:
            f.write(response.content)
        print(f"保存完了: {output_path}")
    else:
        print(f"生成エラー ({key}): {response.text}")

print("全テスト音声の生成処理が完了しました。")
