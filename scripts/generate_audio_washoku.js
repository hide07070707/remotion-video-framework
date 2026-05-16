/**
 * generate_audio_washoku.js
 * scenes.json を読み込み、ElevenLabs API で全425シーンの音声を生成する。
 *
 * 実行方法:
 *   node video/scripts/generate_audio_washoku.js          # 全425シーン
 *   node video/scripts/generate_audio_washoku.js --test   # 先頭3シーンのみ
 *
 * モデル  : eleven_v3
 * テキスト: 漢字そのまま送信（前処理なし）
 * ボイス  : キャラクター別に自動切替
 */

const path = require('path');
const fs   = require('fs');

require(path.join(__dirname, '../node_modules/dotenv')).config({
  path: path.join(__dirname, '../../.env'),
});

// =====================================================
// ★ キャスティング確定（2026-05-05）
// =====================================================
const VOICES = {
  narrator: { id: 'iRDEKpk9hSfW2qkoxsr7', label: 'Yona（ナレーター）'     },
  setsuko:  { id: 'wcs09USXSN5Bl7FXohVZ', label: 'Satomi（節子）'          },
  doctor:   { id: 'b34JylakFZPlGS0BnwyY', label: 'Kenzo（医師）'           },
  shigeru:  { id: 'UUpoAQhpz37lNIWNVLoF', label: 'Kuro（茂）'              },
  mother:   { id: 'e2BxPFZzO0e4DYAokSlV', label: 'Rie（母）'               },
};

// =====================================================
// ★ 話者マップ（シーン番号 → キャラクター）
//   ここに記載のないシーンは全て narrator
// =====================================================
const SPEAKER_MAP = {
  // 節子（71歳）の台詞
  5:   'setsuko',  // 「……疲れているだけ」
  18:  'setsuko',  // ——薄い。
  31:  'setsuko',  // 「……年かしら」
  63:  'setsuko',  // 「洋食より和食。日本人の体には…」
  93:  'setsuko',  // 「ちゃんとやっているのに、なぜ」
  118: 'setsuko',  // 「……はい。毎年、少し高いと…」
  122: 'setsuko',  // 「脳梗塞の、前触れということでしょうか」
  130: 'setsuko',  // 「和食です。ご飯と味噌汁は…」
  131: 'setsuko',  // 「洋食はほとんど食べません」
  137: 'setsuko',  // 「塩分、ですか。でも…」（続く）
  138: 'setsuko',  // 　漬物も食べすぎているつもりは…」
  146: 'setsuko',  // 「私は……母から教わった通りに…」
  155: 'setsuko',  // 「……やさしい味でした…」（続く）
  156: 'setsuko',  // 　飲み飽きない感じで」
  199: 'setsuko',  // 「自分はそんなに塩辛いものは…」
  265: 'setsuko',  // 「まさか、私が」
  272: 'setsuko',  // 「何十年も正しいと思ってきた習慣が」
  273: 'setsuko',  // 「母から教わったあの朝食が」
  274: 'setsuko',  // 「まさか、体を追い詰めていたなんて」

  // 医師（50代）の台詞
  83:  'doctor',   // 「血圧が高めですね。少し気をつけてください」
  117: 'doctor',   // 「節子さん、ここ数年…」
  119: 'doctor',   // 「今日の症状——手の動きと…」（続く）
  120: 'doctor',   // 　これは、軽く見ないほうがいい」
  124: 'doctor',   // 「断言はできません…」（続く）
  125: 'doctor',   // 　血管への負担が…
  126: 'doctor',   // 　生活を見直すことが必要です」
  127: 'doctor',   // 「節子さん、毎日の食事…」
  134: 'doctor',   // 「和食が悪いわけではありません…」（続く）
  135: 'doctor',   // 　塩分が重なりやすいんです」
  139: 'doctor',   // 「一品ずつで見ると…」（続く）
  140: 'doctor',   // 　でも、全部そろったとき…
  141: 'doctor',   // 　それが、毎朝続くとしたら」
  149: 'doctor',   // 「お母さんの料理、どんな味でしたか?」
  158: 'doctor',   // 「その味噌汁、今も同じ味ですか」

  // 茂（夫）の台詞
  384: 'shigeru',  // 「いただきます」
  387: 'shigeru',  // 「……なんか、おふくろの味がする」

  // 母（回想）の台詞
  55:  'mother',   // 「出汁の香りがする。合格」
  324: 'mother',   // 「出汁の香りがする。合格」（再出）
};

// =====================================================
// 共通ボイス設定（グループB: 日本語ボイス + 漢字そのまま）
// =====================================================
const VOICE_SETTINGS = {
  stability:         0.88,
  similarity_boost:  0.85,
  style:             0.03,
  use_speaker_boost: true,
};

const MODEL_ID  = 'eleven_v3';
const DELAY_MS  = 1200;

const API_KEY     = process.env.ELEVENLABS_API_KEY;
const SCENES_FILE = path.join(__dirname, '../public/assets/washoku/scenes.json');
const OUTPUT_DIR  = path.join(__dirname, '../public/assets/washoku/audio');
const IS_TEST     = process.argv.includes('--test');

if (!API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY が .env に設定されていません。');
  process.exit(1);
}
if (!fs.existsSync(SCENES_FILE)) {
  console.error(`❌ scenes.json が見つかりません: ${SCENES_FILE}`);
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const allScenes = JSON.parse(fs.readFileSync(SCENES_FILE, 'utf8'));
const scenes    = IS_TEST ? allScenes.slice(0, 3) : allScenes;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getVoice(sceneNo) {
  const role = SPEAKER_MAP[sceneNo] || 'narrator';
  return { role, ...VOICES[role] };
}

async function generateAudio(voiceId, text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method:  'POST',
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

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  // 話者別統計
  const roleCount = {};
  allScenes.forEach(s => {
    const role = SPEAKER_MAP[s.scene_no] || 'narrator';
    roleCount[role] = (roleCount[role] || 0) + 1;
  });

  console.log('='.repeat(60));
  console.log('  節子の和食ストーリー 音声生成スクリプト');
  console.log('='.repeat(60));
  console.log(`  モード    : ${IS_TEST ? '🧪 テスト（先頭3シーン）' : '🎬 本番（全425シーン）'}`);
  console.log(`  モデル    : ${MODEL_ID}`);
  console.log(`  対象シーン: ${scenes.length} 件`);
  console.log(`  出力先    : ${OUTPUT_DIR}`);
  console.log('');
  console.log('  キャスティング:');
  Object.entries(VOICES).forEach(([role, v]) => {
    console.log(`    ${v.label.padEnd(20)} ${roleCount[role] || 0} シーン`);
  });
  console.log('='.repeat(60));

  let generated = 0;
  let skipped   = 0;
  let errors    = 0;
  const errorList = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene    = scenes[i];
    const outPath  = path.join(OUTPUT_DIR, `${scene.id}.mp3`);
    const progress = `[${String(i + 1).padStart(3, '0')}/${scenes.length}]`;
    const voice    = getVoice(scene.scene_no);

    if (fs.existsSync(outPath)) {
      console.log(`${progress} ⏭  スキップ: ${scene.id}`);
      skipped++;
      continue;
    }

    try {
      const preview = scene.subtitle.replace(/\n/g, ' ').slice(0, 28);
      process.stdout.write(`${progress} [${voice.role.padEnd(8)}] ⏳ ${scene.id}  "${preview}..."`);
      const audio = await generateAudio(voice.id, scene.subtitle);
      fs.writeFileSync(outPath, audio);
      process.stdout.write(`  → ✅ ${(audio.length / 1024).toFixed(0)}KB\n`);
      generated++;
    } catch (err) {
      process.stdout.write(`  → ❌ エラー: ${err.message}\n`);
      errorList.push({ id: scene.id, error: err.message });
      errors++;
    }

    if (i < scenes.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('  完了サマリー');
  console.log('='.repeat(60));
  console.log(`  生成完了 : ${generated} 件`);
  console.log(`  スキップ : ${skipped} 件（生成済み）`);
  console.log(`  エラー   : ${errors} 件`);

  if (errorList.length > 0) {
    console.log('\n⚠️  エラー一覧（再実行すると自動リトライされます）:');
    errorList.forEach(e => console.log(`   ${e.id}: ${e.error}`));
  }

  if (!IS_TEST) {
    console.log('\n✅ 次のステップ:');
    console.log('   node video/scripts/update_durations_washoku.js');
    console.log('   → 音声の長さを計測し、manifest_final.json を生成します。');
  }
}

main().catch(err => {
  console.error('❌ 予期せぬエラー:', err);
  process.exit(1);
});
