/**
 * update_durations_washoku.js
 * 各MP3の再生時間を計測し、scenes.json を更新して manifest_final.json を生成する。
 *
 * 実行方法:
 *   node video/scripts/update_durations_washoku.js
 */

const path = require('path');
const fs   = require('fs');

const FPS         = 30;
const SCENES_FILE = path.join(__dirname, '../public/assets/washoku/scenes.json');
const AUDIO_DIR   = path.join(__dirname, '../public/assets/washoku/audio');
const OUT_FILE    = path.join(__dirname, '../public/assets/washoku/manifest_final.json');

// MP3 の長さをバイナリ解析で取得（外部モジュール不要）
function getMp3DurationSec(filePath) {
  const buf = fs.readFileSync(filePath);
  let offset = 0;
  let totalFrames = 0;

  // ID3v2 タグをスキップ
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    const id3Size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) |
                    ((buf[8] & 0x7f) << 7)  | (buf[9] & 0x7f);
    offset = 10 + id3Size;
  }

  while (offset + 4 < buf.length) {
    // フレームヘッダを探す（0xFF 0xEx or 0xFF 0xFx）
    if (buf[offset] !== 0xFF || (buf[offset + 1] & 0xE0) !== 0xE0) {
      offset++;
      continue;
    }

    const b1 = buf[offset + 1];
    const b2 = buf[offset + 2];

    const versionBits  = (b1 >> 3) & 0x03;
    const layerBits    = (b1 >> 1) & 0x03;
    const bitrateBits  = (b2 >> 4) & 0x0F;
    const sampleBits   = (b2 >> 2) & 0x03;
    const padding      = (b2 >> 1) & 0x01;

    if (bitrateBits === 0 || bitrateBits === 15 || sampleBits === 3) { offset++; continue; }
    if (layerBits === 0 || versionBits === 1) { offset++; continue; }

    const bitrateTable = {
      // MPEG1, Layer3
      '11': [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0],
    };
    const vl = versionBits === 3 ? '1' : '2';
    const ll = layerBits === 1 ? '3' : layerBits === 2 ? '2' : '1';
    const bt = bitrateTable[vl + ll] || bitrateTable['11'];
    const bitrate = bt[bitrateBits] * 1000;
    if (!bitrate) { offset++; continue; }

    const srTable1 = [44100, 48000, 32000];
    const srTable2 = [22050, 24000, 16000];
    const sampleRate = versionBits === 3 ? srTable1[sampleBits] : srTable2[sampleBits];
    if (!sampleRate) { offset++; continue; }

    const samplesPerFrame = (vl === '1' && ll === '3') ? 1152 : 576;
    const frameSize = Math.floor(samplesPerFrame * bitrate / 8 / sampleRate) + padding;

    totalFrames++;
    offset += frameSize || 1;
  }

  // MPEG1 Layer3: 1152 samples/frame
  return totalFrames > 0 ? (totalFrames * 1152) / 44100 : 0;
}

function main() {
  if (!fs.existsSync(SCENES_FILE)) {
    console.error('❌ scenes.json が見つかりません。');
    process.exit(1);
  }

  const scenes = JSON.parse(fs.readFileSync(SCENES_FILE, 'utf8'));
  let updated = 0;
  let missing = 0;
  let totalSec = 0;

  console.log('⏱  音声長さ計測中...\n');

  for (const scene of scenes) {
    const mp3Path = path.join(AUDIO_DIR, `${scene.id}.mp3`);

    if (!fs.existsSync(mp3Path)) {
      console.log(`  ⚠️  見つからない: ${scene.id}.mp3`);
      scene.durationSec    = 0;
      scene.durationInFrames = 0;
      missing++;
      continue;
    }

    try {
      const sec = getMp3DurationSec(mp3Path);
      // 最低0.5秒、最大20秒でクランプ
      const clamped = Math.min(Math.max(sec, 0.5), 20);
      scene.durationSec      = Math.round(clamped * 100) / 100;
      scene.durationInFrames = Math.round(clamped * FPS);
      totalSec += clamped;
      updated++;
    } catch (e) {
      console.log(`  ❌ 計測エラー: ${scene.id}: ${e.message}`);
      scene.durationSec    = 3;
      scene.durationInFrames = 90;
    }
  }

  // scenes.json を更新
  fs.writeFileSync(SCENES_FILE, JSON.stringify(scenes, null, 2), 'utf8');

  // manifest_final.json を生成
  fs.writeFileSync(OUT_FILE, JSON.stringify(scenes, null, 2), 'utf8');

  const totalMin = Math.floor(totalSec / 60);
  const totalSecR = Math.round(totalSec % 60);

  console.log(`✅ 計測完了: ${updated} 件`);
  if (missing > 0) console.log(`⚠️  見つからない: ${missing} 件`);
  console.log(`\n  合計時間    : ${totalMin}分 ${totalSecR}秒`);
  console.log(`  平均シーン長: ${(totalSec / updated).toFixed(2)} 秒`);
  console.log(`\n  更新ファイル:`);
  console.log(`    ${SCENES_FILE}`);
  console.log(`    ${OUT_FILE}`);
  console.log('\n✅ 次のステップ: Remotion でプレビュー確認');
}

main();
