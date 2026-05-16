/**
 * init-story.js
 * 新しいストーリーのディレクトリ・設定ファイルを自動生成する。
 *
 * 使い方:
 *   node video/scripts/init-story.js --name my-story
 */

const fs   = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const nameIdx = args.indexOf('--name');
if (nameIdx === -1 || !args[nameIdx + 1]) {
  console.log('使い方: node video/scripts/init-story.js --name [ストーリー名]');
  console.log('例:     node video/scripts/init-story.js --name my-story');
  process.exit(0);
}

const storyName = args[nameIdx + 1].toLowerCase().replace(/[^a-z0-9-_]/g, '-');
const BASE      = path.join(__dirname, '../public/assets', storyName);
const SCRIPTS   = __dirname;

console.log(`\n🎬 新ストーリー「${storyName}」をセットアップします...\n`);

// ── ディレクトリ作成 ──────────────────────────────
['audio', 'images'].forEach(sub => {
  const dir = path.join(BASE, sub);
  fs.mkdirSync(dir, { recursive: true });
  console.log(`📁 作成: ${dir}`);
});

// ── corrections.json ─────────────────────────────
const correctionsPath = path.join(BASE, 'corrections.json');
if (!fs.existsSync(correctionsPath)) {
  fs.writeFileSync(correctionsPath, JSON.stringify({
    "_comment": `読み間違い修正辞書（${storyName}専用）。words に追加後 fix_readings.js を実行してください。`,
    "words": {},
    "scenes": {}
  }, null, 2), 'utf8');
  console.log(`📄 作成: ${correctionsPath}`);
}

// ── scenes.json（雛形） ───────────────────────────
const scenesPath = path.join(BASE, 'scenes.json');
if (!fs.existsSync(scenesPath)) {
  fs.writeFileSync(scenesPath, JSON.stringify([
    {
      "id": "sc_001",
      "scene_no": 1,
      "image_no": 1,
      "image": `assets/${storyName}/images/img_001.png`,
      "subtitle": "（ここに字幕テキストを入力）",
      "audio": `assets/${storyName}/audio/sc_001.mp3`
    }
  ], null, 2), 'utf8');
  console.log(`📄 作成: ${scenesPath}`);
}

// ── generate_audio_[story].js ─────────────────────
const genSrc = path.join(SCRIPTS, 'generate_audio_washoku.js');
const genDst = path.join(SCRIPTS, `generate_audio_${storyName}.js`);
if (!fs.existsSync(genDst) && fs.existsSync(genSrc)) {
  let src = fs.readFileSync(genSrc, 'utf8');
  src = src.replace(/washoku/g, storyName);
  src = src.replace(
    /\/\/ キャスティング.*?(?=const SCENES_FILE)/s,
    `// キャスティング（役割とVoice IDを設定してください）\nconst VOICES = {\n  narrator: { id: 'iRDEKpk9hSfW2qkoxsr7', label: 'Yona（ナレーター）' },\n  // 追加のキャラクターをここに記述\n};\n\nconst SPEAKER_MAP = {\n  // scene_no: 'role' の形式で記述\n  // 例: 5: 'narrator'\n};\n\n`
  );
  fs.writeFileSync(genDst, src, 'utf8');
  console.log(`📄 作成: ${genDst}`);
}

// ── update_durations_[story].js ───────────────────
const durSrc = path.join(SCRIPTS, 'update_durations_washoku.js');
const durDst = path.join(SCRIPTS, `update_durations_${storyName}.js`);
if (!fs.existsSync(durDst) && fs.existsSync(durSrc)) {
  let src = fs.readFileSync(durSrc, 'utf8');
  src = src.replace(/washoku/g, storyName);
  fs.writeFileSync(durDst, src, 'utf8');
  console.log(`📄 作成: ${durDst}`);
}

// ── fix_readings_[story].js ───────────────────────
const fixSrc = path.join(SCRIPTS, 'fix_readings.js');
const fixDst = path.join(SCRIPTS, `fix_readings_${storyName}.js`);
if (!fs.existsSync(fixDst) && fs.existsSync(fixSrc)) {
  let src = fs.readFileSync(fixSrc, 'utf8');
  src = src.replace(/washoku/g, storyName);
  fs.writeFileSync(fixDst, src, 'utf8');
  console.log(`📄 作成: ${fixDst}`);
}

// ── 完了メッセージ ────────────────────────────────
console.log(`
✅ セットアップ完了！

次のステップ:
  1. ${scenesPath}
     → 台本を元にシーンを記述

  2. video/scripts/generate_audio_${storyName}.js
     → VOICES と SPEAKER_MAP を設定

  3. node video/scripts/generate_audio_${storyName}.js
     → 音声生成

  4. node video/scripts/update_durations_${storyName}.js
     → manifest_final.json を生成

  5. video/src/Root.tsx
     → 新しい Composition を追加

詳しい手順: /create-story スキルを参照
`);
