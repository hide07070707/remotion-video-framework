/**
 * fix_readings.js
 * corrections.json の辞書を使って読み間違いシーンを再生成する。
 *
 * 使い方:
 *   node video/scripts/fix_readings.js --scene sc_042
 *       → シーン sc_042 だけ再生成
 *
 *   node video/scripts/fix_readings.js --word 節子
 *       → 「節子」を含む全シーンを再生成
 *
 *   node video/scripts/fix_readings.js --all
 *       → corrections.json に登録された全修正が影響するシーンを再生成
 *
 *   node video/scripts/fix_readings.js --all --dry-run
 *       → 対象シーンを表示するだけ（実際には生成しない）
 */

const path = require('path');
const fs   = require('fs');

require(path.join(__dirname, '../node_modules/dotenv')).config({
  path: path.join(__dirname, '../../.env'),
});

// =====================================================
// 設定
// =====================================================
const API_KEY         = process.env.ELEVENLABS_API_KEY;
const MODEL_ID        = 'eleven_v3';
const VOICE_SETTINGS  = {
  stability:         0.88,
  similarity_boost:  0.85,
  style:             0.03,
  use_speaker_boost: true,
};
const DELAY_MS        = 1300;

// キャスティング（generate_audio_washoku.js と同じ）
const VOICES = {
  narrator: 'iRDEKpk9hSfW2qkoxsr7',
  setsuko:  'wcs09USXSN5Bl7FXohVZ',
  doctor:   'b34JylakFZPlGS0BnwyY',
  shigeru:  'UUpoAQhpz37lNIWNVLoF',
  mother:   'e2BxPFZzO0e4DYAokSlV',
};

const SPEAKER_MAP = {
  5:'setsuko', 18:'setsuko', 31:'setsuko', 63:'setsuko', 93:'setsuko',
  118:'setsuko', 122:'setsuko', 130:'setsuko', 131:'setsuko',
  137:'setsuko', 138:'setsuko', 146:'setsuko', 155:'setsuko', 156:'setsuko',
  199:'setsuko', 265:'setsuko', 272:'setsuko', 273:'setsuko', 274:'setsuko',
  83:'doctor', 117:'doctor', 119:'doctor', 120:'doctor',
  124:'doctor', 125:'doctor', 126:'doctor', 127:'doctor',
  134:'doctor', 135:'doctor', 139:'doctor', 140:'doctor', 141:'doctor',
  149:'doctor', 158:'doctor',
  384:'shigeru', 387:'shigeru',
  55:'mother', 324:'mother',
};

// =====================================================
// パス
// =====================================================
const SCENES_FILE      = path.join(__dirname, '../public/assets/washoku/scenes.json');
const CORRECTIONS_FILE = path.join(__dirname, '../public/assets/washoku/corrections.json');
const SHARED_FILE      = path.join(__dirname, '../public/assets/shared/corrections.json');
const AUDIO_DIR        = path.join(__dirname, '../public/assets/washoku/audio');

// =====================================================
// ユーティリティ
// =====================================================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * 共有辞書とストーリー固有辞書をマージして返す
 * 優先順位: ストーリー固有 words > 共有 words（同じキーはストーリー固有が勝つ）
 */
function loadCorrections() {
  if (!fs.existsSync(CORRECTIONS_FILE)) {
    console.error('❌ corrections.json が見つかりません:', CORRECTIONS_FILE);
    process.exit(1);
  }
  const story  = JSON.parse(fs.readFileSync(CORRECTIONS_FILE, 'utf8'));
  const shared = fs.existsSync(SHARED_FILE)
    ? JSON.parse(fs.readFileSync(SHARED_FILE, 'utf8'))
    : { words: {} };

  return {
    words:  { ...shared.words, ...story.words },  // story が shared を上書き
    scenes: story.scenes || {},
  };
}

/**
 * テキストに単語辞書を適用（長い順に優先適用）
 */
function applyWordCorrections(text, wordMap) {
  let result = text;
  const entries = Object.entries(wordMap)
    .filter(([k]) => !k.startsWith('_'))
    .sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of entries) {
    result = result.split(from).join(to);
  }
  return result;
}

/**
 * シーンに適用すべき TTS テキストを返す
 * 優先順位: scenes 辞書 > words 辞書（shared+story マージ済み）> 元テキスト
 */
function getTtsText(scene, corrections) {
  if (corrections.scenes?.[scene.id]) {
    return corrections.scenes[scene.id];
  }
  return applyWordCorrections(scene.subtitle, corrections.words || {});
}

async function regenerate(voiceId, text) {
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
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function processScene(scene, ttsText, dryRun) {
  const role    = SPEAKER_MAP[scene.scene_no] || 'narrator';
  const voiceId = VOICES[role];
  const outPath = path.join(AUDIO_DIR, `${scene.id}.mp3`);

  console.log(`  [${role}] ${scene.id}`);
  console.log(`    元テキスト : ${scene.subtitle.replace(/\n/g, '↵').slice(0, 50)}`);
  if (ttsText !== scene.subtitle) {
    console.log(`    修正テキスト: ${ttsText.replace(/\n/g, '↵').slice(0, 50)}`);
  }

  if (dryRun) {
    console.log(`    → [dry-run] スキップ\n`);
    return;
  }

  try {
    const buf = await regenerate(voiceId, ttsText);
    fs.writeFileSync(outPath, buf);
    console.log(`    → ✅ 再生成完了 (${(buf.length / 1024).toFixed(0)}KB)\n`);
  } catch (e) {
    console.log(`    → ❌ エラー: ${e.message}\n`);
  }
}

// =====================================================
// メイン
// =====================================================
async function main() {
  if (!API_KEY) { console.error('❌ ELEVENLABS_API_KEY が未設定です'); process.exit(1); }

  const args   = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const mode   = args.find(a => ['--scene', '--word', '--all'].includes(a));
  const value  = mode ? args[args.indexOf(mode) + 1] : null;

  if (!mode) {
    console.log('使い方:');
    console.log('  node fix_readings.js --scene sc_042');
    console.log('  node fix_readings.js --word 節子');
    console.log('  node fix_readings.js --all [--dry-run]');
    process.exit(0);
  }

  const corrections = loadCorrections();
  const allScenes   = JSON.parse(fs.readFileSync(SCENES_FILE, 'utf8'));

  let targets = [];

  if (mode === '--scene') {
    const scene = allScenes.find(s => s.id === value);
    if (!scene) { console.error(`❌ シーン "${value}" が見つかりません`); process.exit(1); }
    targets = [scene];

  } else if (mode === '--word') {
    if (!value) { console.error('❌ --word の後に単語を指定してください'); process.exit(1); }
    targets = allScenes.filter(s => s.subtitle.includes(value));
    if (targets.length === 0) {
      console.log(`「${value}」を含むシーンは見つかりませんでした。`);
      process.exit(0);
    }

  } else if (mode === '--all') {
    // corrections.json で影響を受けるシーンのみ対象
    targets = allScenes.filter(s => {
      const ttsText = getTtsText(s, corrections);
      return ttsText !== s.subtitle;
    });
    if (targets.length === 0) {
      console.log('修正が必要なシーンはありません（corrections.json に変更を加えてください）。');
      process.exit(0);
    }
  }

  console.log(`\n📝 対象シーン: ${targets.length} 件${dryRun ? '  [dry-run モード]' : ''}\n`);

  for (let i = 0; i < targets.length; i++) {
    const scene   = targets[i];
    const ttsText = getTtsText(scene, corrections);
    await processScene(scene, ttsText, dryRun);
    if (!dryRun && i < targets.length - 1) await sleep(DELAY_MS);
  }

  if (!dryRun) {
    console.log('✅ 完了。Remotion Studio が自動更新されます。');
  }
}

main().catch(err => {
  console.error('❌ 予期せぬエラー:', err);
  process.exit(1);
});
