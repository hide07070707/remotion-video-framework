import os
import re

# ============================================================
# 台本全文 -> V2構成案（全シーンの字幕とLovart.ai用プロンプト）
#
# 方針:
# 1. 視聴者が読みやすいよう、1画面の文字数を【最大約40文字程度】に制限する
# 2. 上下2行に綺麗に収まるよう、適切な位置（句読点付近）に <br> を挿入する
# 3. 意味の切れ目が不自然にならないよう、主に「。」「、」「」」で分割する
# ============================================================

FULL_SCRIPT = r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\projects\reincarnation_story\full_script.txt"
OUT_PLAN = r"c:\Users\suppo\OneDrive\デスクトップ\my-new-app\projects\reincarnation_story\v2_composition_plan.md"


def format_subtitle(text):
    """
    テキストの長さに応じて、適切な位置に <br> を挿入して2行にする
    """
    text = text.strip()
    if len(text) > 20 and "<br>" not in text:
        # 後半にある「、」を探してそこで改行する
        idx = text.rfind('、', 10, len(text) - 5)
        if idx != -1:
            return text[:idx+1] + "<br>" + text[idx+1:]
            
        # 読点がない場合は、文字列の真ん中付近で改行する
        mid = len(text) // 2 + 2
        return text[:mid] + "<br>" + text[mid:]
    return text


def split_into_scenes(text):
    """
    テキストを最大約40文字の長さに分割し、意味の不自然な切れ目を防ぐ
    """
    scenes = []
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line or re.match(r'^第\d+章：', line):
            continue
            
        # 「。！？」「」」でまず大まかに分割
        parts = re.split(r'(?<=[。？！])(?=[^」])|(?<=」)', line)
        current_text = ""
        
        for part in parts:
            part = part.strip()
            if not part: continue
            
            # part自体が長すぎる場合（40文字超え）、読点「、」でさらに分割
            if len(part) > 40:
                subparts = re.split(r'(?<=、)', part)
                for sub in subparts:
                    sub = sub.strip()
                    if not sub: continue
                    
                    if len(current_text) + len(sub) > 40:
                        if current_text:
                            scenes.append(format_subtitle(current_text))
                        current_text = sub
                    else:
                        current_text += sub
            else:
                if len(current_text) + len(part) > 40:
                    if current_text:
                        scenes.append(format_subtitle(current_text))
                    current_text = part
                else:
                    current_text += part
            
            # 句点やカギカッコ閉じで終わっている場合は、そこで1シーンとして確定
            if current_text and (current_text.endswith('。') or current_text.endswith('」') or current_text.endswith('！') or current_text.endswith('？')):
                scenes.append(format_subtitle(current_text))
                current_text = ""
                
        if current_text:
            scenes.append(format_subtitle(current_text))
            
    return scenes


def generate_prompt_for_scene(text, prev_prompts=""):
    """
    テキストの内容から、Lovart.ai用の適切な画像プロンプト（英語）を推測する
    """
    text = text.lower()
    
    # 恵子（主人公）関連
    prompt = "1girl, mature female, Keiko, 70 years old, short grey hair, "
    
    # シーンのキーワードによるプロンプト付与
    if "台所" in text or "五徳" in text or "番茶" in text:
        prompt += "wearing thick socks, standing in old Japanese kitchen, holding a teacup, cold morning, visible breath, "
    elif "パソコン" in text or "画面" in text or "数字" in text or "チャート" in text or "キーボード" in text or "残高" in text:
        prompt += "sitting at a traditional Japanese desk, looking at laptop screen, stock market charts glowing on screen, serious expression, dark room lit by blue screen light, "
    elif "スーパー" in text or "卵" in text:
        prompt += "in a supermarket, holding discounted eggs, thrifty shopping, wearing simple everyday clothes, "
    elif "仏壇" in text or "お父さん" in text:
        prompt += "sitting in front of a traditional Japanese Buddhist altar (Butsudan), praying, calm expression, "
    elif "美津子" in text or "毛皮" in text or "ハイヒール" in text or "ダイヤ" in text:
        prompt = "2girls, mature women, Keiko (70yo, short grey hair, simple clothes) and Mitsuko (70yo, wavy dyed brown hair, flashy makeup, wearing expensive fur coat and diamond jewelry), standing in old Japanese entranceway, "
    elif "息子" in text and "闇金" in text or "二億円" in text:
        prompt = "1girl, mature woman Mitsuko, 70yo, crying, desperate expression, sitting on tatami floor, holding rain-soaked documents, ruined fur coat, "
    elif "佐藤" in text or "ファンド" in text or "銀行" in text or "支店長" in text or "応接室" in text or "債権" in text:
        prompt += "in a luxurious bank reception room, confronting Sato (middle-aged man in suit, arrogant -> pale), and branch manager (older man bowing to Keiko), Keiko looking confident and powerful, "
    elif "質屋" in text or "ブランドバッグ" in text:
        prompt = "1girl, mature woman Mitsuko, 70yo, looking shocked, standing in front of pawn shop counter, luxurious bags and jewelry on counter being evaluated cheaply, "
    elif "梅" in text:
        prompt += "standing in traditional Japanese garden, looking at a single blooming plum flower, gentle sunlight, feeling of hope, "
    else:
        # デフォルトは居間でのシーン
        prompt += "sitting in old simple Japanese living room, calm and quiet atmosphere, "
        
    # Lovart.ai の基本品質プロンプト
    prompt += "ghibli style, cinematic lighting, masterpiece, high quality, highly detailed"
    return prompt


# 実行
print(f"Reading from {FULL_SCRIPT}...")
with open(FULL_SCRIPT, "r", encoding="utf-8") as f:
    text = f.read()

scenes = split_into_scenes(text)
print(f"Split into {len(scenes)} scenes.")

with open(OUT_PLAN, "w", encoding="utf-8") as f:
    f.write("# 恵子と美津子の物語 V2 構成案（台本全文・Lovart.aiプロンプト版）\n\n")
    f.write("※1画面の文字数を最大約40文字に制限し、上下2行に収まるように調整したものです。\n\n")
    f.write("| シーンID | 字幕内容（台本そのまま） | 画像生成用プロンプト (Lovart.ai向き) |\n")
    f.write("|---|---|---|\n")
    
    for i, scene_text in enumerate(scenes):
        scene_id = f"sc_{i+1:03d}"
        prompt = generate_prompt_for_scene(scene_text)
        f.write(f"| {scene_id} | {scene_text} | {prompt} |\n")

print(f"Successfully wrote to {OUT_PLAN}.")
