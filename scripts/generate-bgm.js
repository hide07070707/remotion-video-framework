/**
 * generate-bgm.js
 * ElevenLabs Music API で各章の BGM を生成する
 *
 * 実行: node video/scripts/generate-bgm.js
 */

const https  = require('https');
const fs     = require('fs');
const path   = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const API_KEY    = process.env.ELEVENLABS_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '../public/assets/washoku/audio');

if (!API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY が設定されていません');
  process.exit(1);
}

const CHAPTERS = [
  {
    name: 'ch1',
    label: '第一章（節子の朝）',
    prompt: 'Peaceful Japanese morning, soft piano and gentle shakuhachi flute, calm and warm, slow tempo, instrumental, no lyrics, documentary feel, subtle and understated',
  },
  {
    name: 'ch2',
    label: '第二章（母の味）',
    prompt: 'Nostalgic and warm Japanese melody, soft koto and piano, gentle memories, tender and emotional, instrumental, no lyrics, slow and heartfelt',
  },
  {
    name: 'ch3',
    label: '第三章（病院で）',
    prompt: 'Tense and uneasy atmosphere, minimal sparse piano, quiet strings, somber and dramatic, medical drama, instrumental, no lyrics, slow and heavy',
  },
  {
    name: 'ch4',
    label: '第四章（塩分の正体）',
    prompt: 'Neutral educational documentary style, calm minimal piano, subtle and understated, informative atmosphere, instrumental, no lyrics, steady and clear',
  },
  {
    name: 'ch5',
    label: '第五章（見直し）',
    prompt: 'Hopeful and uplifting, gentle piano melody, warm and encouraging, turning point, light and optimistic, instrumental, no lyrics, moderate tempo',
  },
  {
    name: 'ch6',
    label: '第六章（翌朝）',
    prompt: 'Warm emotional resolution, touching piano, Japanese morning light feeling, peaceful and healing, tender ending, instrumental, no lyrics, gentle and slow',
  },
];

function generateBGM(chapter) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      prompt:            chapter.prompt,
      music_length_ms:   90000,   // 90秒（Remotion側でループ再生）
      force_instrumental: true,
      model_id:          'music_v1',
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path:     '/v1/music/stream?output_format=mp3_44100_128',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'xi-api-key':     API_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const outputPath = path.join(OUTPUT_DIR, `bgm_${chapter.name}.mp3`);
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
        console.log(`  ✅ 保存: bgm_${chapter.name}.mp3 (${(size/1024).toFixed(0)} KB)`);
        resolve(outputPath);
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🎵 ElevenLabs BGM 生成開始\n');

  for (const chapter of CHAPTERS) {
    console.log(`生成中: ${chapter.label}`);
    try {
      await generateBGM(chapter);
    } catch (err) {
      console.error(`  ❌ 失敗: ${err.message}`);
    }
    // API レート制限対策
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n✅ 全 BGM 生成完了');
  console.log('次のステップ: WashokuComposition.tsx に BGM を実装します');
}

main();
