/**
 * generate_compare_samples.js
 * 英語ボイス(raw) vs 日本語ボイス(raw) vs 日本語ボイス(ひらがな済み) を比較するサンプルを生成。
 *
 * 生成ファイル名:
 *   cmp_rachel_sc_001.mp3   … Rachel（英語）+ 漢字そのまま
 *   cmp_dorothy_sc_001.mp3  … Dorothy（英語）+ 漢字そのまま
 *   cmp_akari_raw_sc_001.mp3  … Akari（日本語）+ 漢字そのまま
 *   cmp_yona_raw_sc_001.mp3   … Yona（日本語）+ 漢字そのまま
 *
 * 比較用に既存の v3_sc_001_akari.mp3, v3_sc_001_yona.mp3（ひらがな版）も HTML で並べる。
 */
const path = require('path');
const fs   = require('fs');

require(path.join(__dirname, '../node_modules/dotenv')).config({
  path: path.join(__dirname, '../../.env'),
});

const API_KEY  = process.env.ELEVENLABS_API_KEY;
const MODEL_ID = 'eleven_v3';
const OUT_DIR  = path.join(__dirname, '../public/assets/washoku/audio');

// =====================================================
// グループA: 英語ボイス（漢字テキストをそのまま渡す）
// =====================================================
const ENGLISH_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'rachel',  label: 'Rachel（英語・凛とした知的）' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'dorothy', label: 'Dorothy（英語・落ち着いた深み）' },
];
const ENGLISH_SETTINGS = {
  stability:        0.55,
  similarity_boost: 0.75,
  style:            0.15,
  use_speaker_boost: true,
};

// =====================================================
// グループB: 日本語ネイティブボイス（漢字テキストをそのまま渡す）
// =====================================================
const JP_VOICES = [
  { id: 'EkK6wL8GaH8IgBZTTDGJ', name: 'akari_raw', label: 'Akari（日本語・漢字そのまま）' },
  { id: 'iRDEKpk9hSfW2qkoxsr7', name: 'yona_raw',  label: 'Yona（日本語・漢字そのまま）'  },
];
const JP_SETTINGS = {
  stability:        0.88,
  similarity_boost: 0.85,
  style:            0.03,
  use_speaker_boost: true,
};

// =====================================================
// サンプルシーン（漢字テキストをそのまま使用）
// =====================================================
const SAMPLES = [
  { id: 'sc_001', text: '箸が、止まった。' },
  { id: 'sc_002', text: '右手に持ったお玉が、わずかに揺れた。' },
  { id: 'sc_003', text: '気のせいかと思い、節子はもう一度、鍋の中の味噌汁をよそおうとした。' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generate(voiceId, text, settings) {
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
      voice_settings: settings,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  if (!API_KEY) { console.error('❌ ELEVENLABS_API_KEY が未設定です'); process.exit(1); }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('🎙 比較サンプル生成開始\n');
  console.log('グループA: 英語ボイス + 漢字テキスト');
  console.log('グループB: 日本語ボイス + 漢字テキスト（前処理なし）\n');

  const allVoices = [
    ...ENGLISH_VOICES.map(v => ({ ...v, settings: ENGLISH_SETTINGS, group: 'A' })),
    ...JP_VOICES.map(v     => ({ ...v, settings: JP_SETTINGS,      group: 'B' })),
  ];

  for (const voice of allVoices) {
    console.log(`▶ [グループ${voice.group}] ${voice.label}`);
    for (const scene of SAMPLES) {
      const filename = `cmp_${voice.name}_${scene.id}.mp3`;
      const outPath  = path.join(OUT_DIR, filename);

      if (fs.existsSync(outPath)) {
        console.log(`  ⏭  スキップ: ${filename}（生成済み）`);
        continue;
      }

      try {
        console.log(`  テキスト: "${scene.text}"`);
        const buf = await generate(voice.id, scene.text, voice.settings);
        fs.writeFileSync(outPath, buf);
        console.log(`  ✅ ${filename} (${(buf.length / 1024).toFixed(0)}KB)\n`);
      } catch (e) {
        console.log(`  ❌ ${filename}: ${e.message}\n`);
      }
      await sleep(1300);
    }
  }

  console.log('完了。次は audition_compare.html をブラウザで開いて聴き比べてください。');
}

main();
