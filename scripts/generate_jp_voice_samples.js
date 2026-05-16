/**
 * generate_jp_voice_samples.js
 * 日本語ネイティブボイス4種のサンプルを生成する。
 */
const path = require('path');
const fs   = require('fs');

require(path.join(__dirname, '../node_modules/dotenv')).config({
  path: path.join(__dirname, '../../.env'),
});

const { initPreprocessor, toKana } = require('./preprocess_washoku');

const API_KEY  = process.env.ELEVENLABS_API_KEY;
const MODEL_ID = 'eleven_multilingual_v2';
const OUT_DIR  = path.join(__dirname, '../public/assets/washoku/audio');

const VOICES = [
  { id: 'c2XJrw7TvNGtOc6r0ijG', name: 'harune',   label: 'Harune（プロナレーション・女性）' },
  { id: '3321Alera3fXjEWjjbAX', name: 'akane',    label: 'Akane（柔らか・温かい・女性）'    },
  { id: '17ljzcHzSunXNkdixIEa', name: 'hirokoji', label: 'Hirokoji（元アナウンサー・正確な発音）' },
  { id: 'NuhW57w81uacPyz9OIsB', name: 'kaoru',    label: '神河かおる Kaoru（物語語り・男性）' },
];

const SAMPLES = [
  { id: 'sc_001', text: '箸が、止まった。' },
  { id: 'sc_002', text: '右手に持ったお玉が、わずかに揺れた。' },
  { id: 'sc_003', text: '気のせいかと思い、節子はもう一度、鍋の中の味噌汁をよそおうとした。' },
];

const VOICE_SETTINGS = {
  stability: 0.60,
  similarity_boost: 0.80,
  style: 0.10,
  use_speaker_boost: true,
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generate(voiceId, text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': API_KEY,
    },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`HTTP ${res.status}: ${msg.slice(0, 120)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('⏳ ひらがな変換エンジンを初期化中...');
  await initPreprocessor();
  console.log('日本語ボイスサンプル生成開始（ひらがな前処理あり）...\n');

  for (const voice of VOICES) {
    console.log(`▶ ${voice.label}`);
    for (const scene of SAMPLES) {
      const filename = `${scene.id}_${voice.name}.mp3`;
      const outPath  = path.join(OUT_DIR, filename);

      // 前処理ありで再生成するため既存ファイルを上書き
      try {
        const kanaText = await toKana(scene.text);
        console.log(`  変換: "${scene.text}" → "${kanaText}"`);
        const buf = await generate(voice.id, kanaText);
        fs.writeFileSync(outPath, buf);
        console.log(`  ✅ ${filename} (${(buf.length/1024).toFixed(0)}KB)`);
      } catch (e) {
        console.log(`  ❌ ${filename}: ${e.message}`);
      }
      await sleep(1300);
    }
    console.log();
  }
  console.log('完了。');
}

main();
