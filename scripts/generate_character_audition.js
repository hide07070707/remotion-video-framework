/**
 * generate_character_audition.js
 * キャラクター別ボイスオーディション用サンプルを生成。
 * グループB設定（日本語ボイス + 漢字テキストそのまま）を使用。
 */
const path = require('path');
const fs   = require('fs');

require(path.join(__dirname, '../node_modules/dotenv')).config({
  path: path.join(__dirname, '../../.env'),
});

const API_KEY  = process.env.ELEVENLABS_API_KEY;
const MODEL_ID = 'eleven_v3';
const OUT_DIR  = path.join(__dirname, '../public/assets/washoku/audio');

// グループB設定（日本語ボイス + 漢字そのまま）
const SETTINGS = {
  stability:         0.88,
  similarity_boost:  0.85,
  style:             0.03,
  use_speaker_boost: true,
};

// =====================================================
// キャラクター別ボイス候補と台詞サンプル
// =====================================================
const CHARACTERS = [
  {
    role: 'setsuko',
    label: '節子（71歳・台詞）',
    voices: [
      { id: '3321Alera3fXjEWjjbAX', name: 'akane',  label: 'Akane（茜）- 柔らか・温かい' },
      { id: 'wcs09USXSN5Bl7FXohVZ', name: 'satomi', label: 'Satomi - 落ち着いた・穏やか' },
    ],
    lines: [
      { id: '001', text: '……疲れているだけ' },
      { id: '002', text: '脳梗塞の、前触れということでしょうか' },
    ],
  },
  {
    role: 'doctor',
    label: '医師（50代・男性）',
    voices: [
      { id: 'NuhW57w81uacPyz9OIsB', name: 'kaoru', label: '神河かおる Kaoru - 落ち着いた男性' },
      { id: 'b34JylakFZPlGS0BnwyY', name: 'kenzo', label: 'Kenzo - 穏やか・プロフェッショナル' },
    ],
    lines: [
      { id: '001', text: '血圧が高めですね。少し気をつけてください' },
      { id: '002', text: '断言はできません。ただ、血圧がこの状態で続いていると、血管への負担が積み重なりやすい' },
    ],
  },
  {
    role: 'shigeru',
    label: '茂（夫・高齢男性）',
    voices: [
      { id: 'pUgmTF2V1ptIKsYb6qON', name: 'ryo',  label: 'Ryo - 穏やか・低め・紳士的' },
      { id: 'UUpoAQhpz37lNIWNVLoF', name: 'kuro', label: 'Kuro - 成熟・温かみのある低音' },
    ],
    lines: [
      { id: '001', text: '……なんか、おふくろの味がする' },
      { id: '002', text: 'いただきます' },
    ],
  },
  {
    role: 'mother',
    label: '母（回想シーン）',
    voices: [
      { id: 'e2BxPFZzO0e4DYAokSlV', name: 'rie',   label: 'Rie - 優しく情感豊か' },
      { id: '3321Alera3fXjEWjjbAX', name: 'akane', label: 'Akane（茜）- 柔らか・温かい' },
    ],
    lines: [
      { id: '001', text: 'やってみなさい' },
      { id: '002', text: '出汁の香りがする。合格' },
    ],
  },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generate(voiceId, text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept':       'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key':   API_KEY,
    },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: SETTINGS }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  if (!API_KEY) { console.error('❌ ELEVENLABS_API_KEY が未設定です'); process.exit(1); }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('🎙 キャラクターボイスオーディション生成開始\n');

  for (const char of CHARACTERS) {
    console.log(`━━━ ${char.label} ━━━`);
    for (const voice of char.voices) {
      console.log(`  ▶ ${voice.label}`);
      for (const line of char.lines) {
        const filename = `char_${char.role}_${voice.name}_${line.id}.mp3`;
        const outPath  = path.join(OUT_DIR, filename);

        if (fs.existsSync(outPath)) {
          console.log(`    ⏭  スキップ: ${filename}`);
          continue;
        }

        try {
          console.log(`    テキスト: 「${line.text}」`);
          const buf = await generate(voice.id, line.text);
          fs.writeFileSync(outPath, buf);
          console.log(`    ✅ ${filename} (${(buf.length / 1024).toFixed(0)}KB)\n`);
        } catch (e) {
          console.log(`    ❌ ${filename}: ${e.message}\n`);
        }
        await sleep(1300);
      }
    }
    console.log();
  }

  console.log('完了。audition_characters.html をブラウザで開いて聴き比べてください。');
}

main();
