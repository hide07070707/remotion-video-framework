/**
 * generate_v3_samples.js
 * ElevenLabs v3 + Audio Tags で日本語ナレーションサンプルを生成。
 * 節子の和食ストーリー向け4ボイス比較用。
 */
const path = require('path');
const fs   = require('fs');

require(path.join(__dirname, '../node_modules/dotenv')).config({
  path: path.join(__dirname, '../../.env'),
});

const { initPreprocessor, toKana } = require('./preprocess_washoku');

const API_KEY  = process.env.ELEVENLABS_API_KEY;
const MODEL_ID = 'eleven_v3';           // ← v3 に変更
const OUT_DIR  = path.join(__dirname, '../public/assets/washoku/audio');

// =====================================================
// 比較対象ボイス（節子の物語ナレーション向け）
// =====================================================
const VOICES = [
  { id: 'EkK6wL8GaH8IgBZTTDGJ', name: 'akari',  label: 'Akari（明るく自然な女性）'    },
  { id: 'iRDEKpk9hSfW2qkoxsr7', name: 'yona',   label: 'Yona（落ち着いた明瞭な女性）'  },
  { id: 'RWZ1lnBIIgPBTpyCnKn2', name: 'renren', label: 'Renren（柔らか・静かな女性）'  },
  { id: 'NuhW57w81uacPyz9OIsB', name: 'kaoru',  label: '神河かおる Kaoru（物語語り・男性）' },
];

// =====================================================
// サンプルシーン（Audio Tags付き）
// v3 推奨タグ: [calm] [warmly] [pause] [sad] [gently]
// ★ 短く力強い文にはタグなし、長い文に [calm] を付与
// =====================================================
const SAMPLES = [
  {
    id:       'sc_001',
    original: '箸が、止まった。',
  },
  {
    id:       'sc_002',
    original: '右手に持ったお玉が、わずかに揺れた。',
  },
  {
    id:       'sc_003',
    original: '気のせいかと思い、節子はもう一度、鍋の中の味噌汁をよそおうとした。',
  },
];

const VOICE_SETTINGS = {
  stability:        0.88,   // 高め → 標準語アクセントに安定
  similarity_boost: 0.85,
  style:            0.03,   // 限りなく低く → 個性・訛りを抑制
  use_speaker_boost: true,
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generate(voiceId, text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept':       'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key':   API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id:       MODEL_ID,
      voice_settings: VOICE_SETTINGS,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('⏳ ひらがな変換エンジンを初期化中...');
  await initPreprocessor();
  console.log(`🎙 eleven_v3 サンプル生成開始\n`);

  for (const voice of VOICES) {
    console.log(`▶ ${voice.label}`);
    for (const scene of SAMPLES) {
      const filename = `v3_${scene.id}_${voice.name}.mp3`;
      const outPath  = path.join(OUT_DIR, filename);

      try {
        // ひらがな変換
        const kana = await toKana(scene.original);
        // Audio Tag 付与（タグがある場合のみ）
        const ttsText = scene.tag ? `[${scene.tag}] ${kana}` : kana;

        console.log(`  テキスト: "${ttsText}"`);
        const buf = await generate(voice.id, ttsText);
        fs.writeFileSync(outPath, buf);
        console.log(`  ✅ ${filename} (${(buf.length/1024).toFixed(0)}KB)\n`);
      } catch (e) {
        console.log(`  ❌ ${filename}: ${e.message}\n`);
      }
      await sleep(1300);
    }
  }
  console.log('完了。');
}

main();
