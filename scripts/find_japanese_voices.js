/**
 * find_japanese_voices.js
 * ElevenLabs API から日本語対応ボイスを検索して表示する。
 */
const path = require('path');
require(path.join(__dirname, '../node_modules/dotenv')).config({
  path: path.join(__dirname, '../../.env'),
});

const API_KEY = process.env.ELEVENLABS_API_KEY;

async function main() {
  // 共有ライブラリのボイスを取得（日本語フィルター）
  const res = await fetch(
    'https://api.elevenlabs.io/v1/shared-voices?language=ja&page_size=20&sort=trending',
    { headers: { 'xi-api-key': API_KEY } }
  );
  const data = await res.json();

  console.log('=== 日本語対応 共有ボイス（トレンド順）===\n');
  if (data.voices) {
    data.voices.forEach((v, i) => {
      console.log(`[${i+1}] ${v.name}`);
      console.log(`    ID     : ${v.voice_id}`);
      console.log(`    言語   : ${v.language || '-'}`);
      console.log(`    カテゴリ: ${v.category || '-'}`);
      console.log(`    説明   : ${(v.description || '-').slice(0, 60)}`);
      console.log();
    });
  }

  // 自分のボイスライブラリも確認
  const myRes = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': API_KEY }
  });
  const myData = await myRes.json();
  console.log('=== マイボイス一覧 ===\n');
  (myData.voices || []).forEach(v => {
    const labels = Object.values(v.labels || {}).join(', ');
    console.log(`- ${v.name} (${v.voice_id})`);
    if (labels) console.log(`  ラベル: ${labels}`);
  });
}

main().catch(console.error);
