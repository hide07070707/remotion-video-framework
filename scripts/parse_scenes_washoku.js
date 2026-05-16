/**
 * parse_scenes_washoku.js
 * 20260421washoku.txt を解析し、Remotion用 scenes.json を生成する。
 *
 * 出力先: video/public/assets/washoku/scenes.json
 * 実行方法: node video/scripts/parse_scenes_washoku.js
 */

const fs   = require('fs');
const path = require('path');

// --- パス設定 ---
const INPUT_FILE  = path.join(__dirname, '../../20260421washoku.txt');
const OUTPUT_DIR  = path.join(__dirname, '../public/assets/washoku');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'scenes.json');

// --- JPGで保存された画像番号（それ以外はすべてPNG）---
const JPG_IMAGES = new Set([42, 113]);

// --- ヘルパー関数 ---
function getImagePath(imgNo) {
  const padded = String(imgNo).padStart(3, '0');
  const ext    = JPG_IMAGES.has(imgNo) ? '.jpg' : '.png';
  return `assets/washoku/images/img_${padded}${ext}`;
}

function getAudioPath(sceneNo) {
  const padded = String(sceneNo).padStart(3, '0');
  return `assets/washoku/audio/sc_${padded}.mp3`;
}

// --- 解析 ---
if (!fs.existsSync(INPUT_FILE)) {
  console.error(`❌ 入力ファイルが見つかりません: ${INPUT_FILE}`);
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const content = fs.readFileSync(INPUT_FILE, 'utf8');
const lines   = content.split('\n').map(l => l.trim());

const SCENE_RE = /^【シーン(\d+)】【画像(\d+)】/;
const GROUP_RE = /^【画像グループ/;

const scenes = [];

for (let i = 0; i < lines.length; i++) {
  const sceneMatch = lines[i].match(SCENE_RE);
  if (!sceneMatch) continue;

  const sceneNo = parseInt(sceneMatch[1], 10);
  const imgNo   = parseInt(sceneMatch[2], 10);

  // 次のシーンまたは画像グループ行まで、テキストを収集する
  const textLines = [];
  i++;
  while (i < lines.length && !lines[i].match(SCENE_RE) && !lines[i].match(GROUP_RE)) {
    textLines.push(lines[i]);
    i++;
  }
  i--; // ループの i++ と相殺するために1戻す

  // 先頭・末尾の空行を除去し、連続する空行を1つにまとめる
  const subtitle = textLines
    .join('\n')
    .trim()
    .replace(/\n{2,}/g, '\n');

  const sceneId = `sc_${String(sceneNo).padStart(3, '0')}`;

  scenes.push({
    id:              sceneId,
    scene_no:        sceneNo,
    image_no:        imgNo,
    image:           getImagePath(imgNo),
    audio:           getAudioPath(sceneNo),
    subtitle,
    durationSec:     0,   // 音声生成後に update_durations_washoku.js で更新
    durationInFrames: 0,
  });
}

// --- 出力 ---
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(scenes, null, 2), 'utf8');

console.log(`✅ scenes.json 生成完了`);
console.log(`   シーン数  : ${scenes.length}`);
console.log(`   出力先    : ${OUTPUT_FILE}`);

// --- 整合性チェック ---
const usedImageNos  = [...new Set(scenes.map(s => s.image_no))].sort((a, b) => a - b);
const expectedTotal = 116;

console.log(`\n📊 整合性チェック`);
console.log(`   使用画像グループ数: ${usedImageNos.length} / ${expectedTotal}`);

const missingImages = [];
for (let n = 1; n <= expectedTotal; n++) {
  if (!usedImageNos.includes(n)) missingImages.push(n);
}
if (missingImages.length > 0) {
  console.warn(`⚠️  未使用の画像グループ番号: ${missingImages.join(', ')}`);
} else {
  console.log(`   画像グループ: img_001〜img_116 すべて使用されています ✅`);
}

// 先頭・末尾5件を表示してサンプル確認
console.log(`\n📋 先頭5件サンプル`);
scenes.slice(0, 5).forEach(s => {
  console.log(`   ${s.id} | ${s.image} | "${s.subtitle.replace(/\n/g, ' / ')}"`);
});
console.log(`\n📋 末尾5件サンプル`);
scenes.slice(-5).forEach(s => {
  console.log(`   ${s.id} | ${s.image} | "${s.subtitle.replace(/\n/g, ' / ')}"`);
});
