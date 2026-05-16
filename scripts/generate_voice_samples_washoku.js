/**
 * generate_voice_samples_washoku.js
 * 3つのボイスで同じ3シーンを生成し、聴き比べ用サンプルを作成する。
 */

const path = require('path');
const fs   = require('fs');

require(path.join(__dirname, '../node_modules/dotenv')).config({
  path: path.join(__dirname, '../../.env'),
});

const API_KEY  = process.env.ELEVENLABS_API_KEY;
const MODEL_ID = 'eleven_multilingual_v2';
const OUT_DIR  = path.join(__dirname, '../public/assets/washoku/audio');

const VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'rachel',  label: 'Rachel（凛とした知的な声）' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'dorothy', label: 'Dorothy（落ち着いた深い声）' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'bella',   label: 'Bella（優しく柔らかい声）'  },
];

const SAMPLES = [
  { id: 'sc_001', text: '箸が、止まった。' },
  { id: 'sc_002', text: '右手に持ったお玉が、わずかに揺れた。' },
  { id: 'sc_003', text: '気のせいかと思い、節子はもう一度、鍋の中の味噌汁をよそおうとした。' },
];

const VOICE_SETTINGS = { stability: 0.55, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generate(voiceId, text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Accept': 'audio/mpeg', 'Content-Type': 'application/json', 'xi-api-key': API_KEY },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('ボイスサンプル生成開始...\n');

  for (const voice of VOICES) {
    console.log(`▶ ${voice.label}`);
    for (const scene of SAMPLES) {
      const filename = `${scene.id}_${voice.name}.mp3`;
      const outPath  = path.join(OUT_DIR, filename);

      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
        console.log(`  ⏭  スキップ: ${filename}`);
        continue;
      }
      try {
        const buf = await generate(voice.id, scene.text);
        fs.writeFileSync(outPath, buf);
        console.log(`  ✅ ${filename} (${(buf.length/1024).toFixed(0)}KB)`);
      } catch (e) {
        console.log(`  ❌ ${filename}: ${e.message}`);
      }
      await sleep(1200);
    }
    console.log();
  }
  console.log('完了。次は audition_washoku.html を開いて聴き比べてください。');
}

main();
