/**
 * generate-sfx.js
 * ElevenLabs Sound Effects API でテロップ用効果音を生成する
 *
 * 実行: node video/scripts/generate-sfx.js
 */

const https  = require('https');
const fs     = require('fs');
const path   = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const API_KEY    = process.env.ELEVENLABS_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '../public/assets/sfx');

if (!API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY が設定されていません');
  process.exit(1);
}

const SFX_LIST = [
  {
    name:     'emphasis_red',
    label:    '強調テロップ（赤・警告）',
    text:     'Heavy cinematic impact boom, dramatic whoosh, powerful hit sound effect',
    duration: 1.5,
  },
  {
    name:     'emphasis_yellow',
    label:    '強調テロップ（黄・温かい）',
    text:     'Soft warm chime, gentle magical sparkle ding, light bell tinkle',
    duration: 1.2,
  },
  {
    name:     'number',
    label:    '数字テロップ（カウントアップ）',
    text:     'Rapid digital counter beeping, quick typewriter ticking sound, counting up',
    duration: 1.5,
  },
  {
    name:     'chapter',
    label:    'チャプタータイトルカード',
    text:     'Japanese temple bell deep resonant gong strike, zen meditation bell, single hit fade',
    duration: 2.5,
  },
  {
    name:     'stripe',
    label:    '帯テロップ（情報・警告）',
    text:     'News broadcast short alert chime, TV information jingle, crisp notification tone',
    duration: 1.0,
  },
  {
    name:     'question',
    label:    '疑問吹き出し',
    text:     'Playful cartoon pop bubble sound, light boing, fun question mark effect',
    duration: 0.8,
  },
  {
    name:     'vertical',
    label:    '縦文字テロップ',
    text:     'Quick sharp whoosh slide, swift text reveal swoosh, fast air movement',
    duration: 0.7,
  },
];

function generateSFX(sfx) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text:             sfx.text,
      duration_seconds: sfx.duration,
      prompt_influence: 0.5,
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path:     '/v1/sound-generation?output_format=mp3_44100_128',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'xi-api-key':     API_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const outputPath = path.join(OUTPUT_DIR, `${sfx.name}.mp3`);
    const file       = fs.createWriteStream(outputPath);

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let err = '';
        res.on('data', d => err += d);
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${err}`)));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        const size = fs.statSync(outputPath).size;
        console.log(`  ✅ 保存: ${sfx.name}.mp3 (${(size/1024).toFixed(0)} KB)`);
        resolve(outputPath);
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🔊 ElevenLabs 効果音生成開始\n');

  for (const sfx of SFX_LIST) {
    console.log(`生成中: ${sfx.label}`);
    try {
      await generateSFX(sfx);
    } catch (err) {
      console.error(`  ❌ 失敗: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n✅ 全効果音生成完了');
}

main();
