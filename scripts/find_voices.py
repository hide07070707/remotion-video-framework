import requests

API_KEY = "AIzaSyCB93b_Nja2G1evVeuTruTj3lOGjXht8AM"
url = f"https://texttospeech.googleapis.com/v1/voices?key={API_KEY}"

try:
    response = requests.get(url)
    voices = response.json().get('voices', [])
    print("ja-JP の Neural2 モデル一覧:")
    for v in voices:
        lang_codes = v.get('languageCodes', [])
        name = v.get('name', '')
        gender = v.get('ssmlGender', '')
        if 'ja-JP' in lang_codes and 'Neural2' in name:
            print(f"- {name} (Gender: {gender})")
except Exception as e:
    print(f"Error: {e}")
