/**
 * corrections-server.js
 * 読み間違い修正ツール（ローカルWebサーバー）
 *
 * 起動: node video/scripts/corrections-server.js
 * ブラウザ: http://localhost:3000
 */

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');
const { spawn } = require('child_process');

const PORT             = parseInt(process.env.PORT) || 3000;
const CORRECTIONS_FILE = path.join(__dirname, '../public/assets/washoku/corrections.json');
const SHARED_FILE      = path.join(__dirname, '../public/assets/shared/corrections.json');
const MANIFEST_FILE    = path.join(__dirname, '../public/assets/washoku/manifest_final.json');
const SCENES_FILE      = path.join(__dirname, '../public/assets/washoku/scenes.json');
const AUDIO_DIR        = path.join(__dirname, '../public/assets/washoku/audio');
const IMAGES_DIR       = path.join(__dirname, '../public/assets/washoku/images');
const PUBLIC_DIR       = path.join(__dirname, '../public');
const FIX_SCRIPT       = path.join(__dirname, 'fix_readings.js');
const UI_FILE          = path.join(__dirname, 'corrections-ui.html');
const IMAGES_UI_FILE   = path.join(__dirname, 'images-ui.html');

const FPS = 30;

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// MP3 の長さをバイナリ解析で取得（外部モジュール不要）
function getMp3DurationSec(filePath) {
  const buf = fs.readFileSync(filePath);
  let offset = 0;
  let totalFrames = 0;
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    const id3Size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) |
                    ((buf[8] & 0x7f) << 7)  | (buf[9] & 0x7f);
    offset = 10 + id3Size;
  }
  while (offset + 4 < buf.length) {
    if (buf[offset] !== 0xFF || (buf[offset + 1] & 0xE0) !== 0xE0) { offset++; continue; }
    const b1 = buf[offset + 1], b2 = buf[offset + 2];
    const versionBits = (b1 >> 3) & 0x03, layerBits = (b1 >> 1) & 0x03;
    const bitrateBits = (b2 >> 4) & 0x0F, sampleBits = (b2 >> 2) & 0x03;
    const padding = (b2 >> 1) & 0x01;
    if (bitrateBits === 0 || bitrateBits === 15 || sampleBits === 3) { offset++; continue; }
    if (layerBits === 0 || versionBits === 1) { offset++; continue; }
    const vl = versionBits === 3 ? '1' : '2';
    const ll = layerBits === 1 ? '3' : layerBits === 2 ? '2' : '1';
    const bt = { '11': [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0] }[vl + ll]
            || [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0];
    const bitrate = bt[bitrateBits] * 1000;
    if (!bitrate) { offset++; continue; }
    const srTable = versionBits === 3 ? [44100, 48000, 32000] : [22050, 24000, 16000];
    const sampleRate = srTable[sampleBits];
    if (!sampleRate) { offset++; continue; }
    const frameSize = Math.floor(1152 * bitrate / 8 / sampleRate) + padding;
    totalFrames++;
    offset += frameSize || 1;
  }
  return totalFrames > 0 ? (totalFrames * 1152) / 44100 : 0;
}

// 再生成後に manifest と scenes.json の duration + audioTs を更新
function updateDurationsAfterRegen(startTime) {
  try {
    const manifest = readJSON(MANIFEST_FILE);
    let count = 0;
    manifest.forEach(item => {
      const audioPath = path.join(AUDIO_DIR, `${item.id}.mp3`);
      if (!fs.existsSync(audioPath)) return;
      const stat = fs.statSync(audioPath);
      if (stat.mtimeMs < startTime) return;
      // duration 更新
      try {
        const sec = getMp3DurationSec(audioPath);
        const clamped = Math.min(Math.max(sec, 0.5), 20);
        item.durationSec      = Math.round(clamped * 100) / 100;
        item.durationInFrames = Math.round(clamped * FPS);
      } catch {}
      item.audioTs = Math.round(stat.mtimeMs);
      count++;
    });
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');

    // scenes.json にも同期（duration のみ）
    if (fs.existsSync(SCENES_FILE)) {
      const scenes = readJSON(SCENES_FILE);
      const byId = Object.fromEntries(manifest.map(m => [m.id, m]));
      scenes.forEach(s => {
        const m = byId[s.id];
        if (m && m.audioTs >= startTime) {
          s.durationSec      = m.durationSec;
          s.durationInFrames = m.durationInFrames;
        }
      });
      fs.writeFileSync(SCENES_FILE, JSON.stringify(scenes, null, 2), 'utf8');
    }

    console.log(`✅ duration + audioTs を ${count} シーン更新しました`);
  } catch (e) {
    console.error('duration 更新エラー:', e.message);
  }
}

function serveAudio(res, filePath) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type':  'audio/mpeg',
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(filePath).pipe(res);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url);

  // UI
  if (req.method === 'GET' && pathname === '/') {
    const html = fs.readFileSync(UI_FILE, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // シーン一覧
  if (req.method === 'GET' && pathname === '/api/scenes') {
    try { json(res, readJSON(MANIFEST_FILE)); }
    catch(e) { json(res, { error: e.message }, 500); }
    return;
  }

  // corrections 取得
  if (req.method === 'GET' && pathname === '/api/corrections') {
    try { json(res, readJSON(CORRECTIONS_FILE)); }
    catch(e) { json(res, { error: e.message }, 500); }
    return;
  }

  // corrections 保存
  if (req.method === 'POST' && pathname === '/api/corrections') {
    try {
      const data = await parseBody(req);
      fs.writeFileSync(CORRECTIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
      json(res, { ok: true });
    } catch(e) { json(res, { error: e.message }, 500); }
    return;
  }

  // 共有辞書 取得
  if (req.method === 'GET' && pathname === '/api/shared-corrections') {
    try { json(res, readJSON(SHARED_FILE)); }
    catch(e) { json(res, { error: e.message }, 500); }
    return;
  }

  // 共有辞書 保存
  if (req.method === 'POST' && pathname === '/api/shared-corrections') {
    try {
      const data = await parseBody(req);
      fs.writeFileSync(SHARED_FILE, JSON.stringify(data, null, 2), 'utf8');
      json(res, { ok: true });
    } catch(e) { json(res, { error: e.message }, 500); }
    return;
  }

  // 再生成
  if (req.method === 'POST' && pathname === '/api/regenerate') {
    try {
      const { mode, value } = await parseBody(req);
      const argMap = { scene: ['--scene', value], word: ['--word', value], all: ['--all'] };
      const args = argMap[mode];
      if (!args) { json(res, { error: 'invalid mode' }, 400); return; }

      const startTime = Date.now();
      const proc = spawn('node', [FIX_SCRIPT, ...args], { cwd: __dirname });
      let out = '';
      proc.stdout.on('data', d => { out += d; process.stdout.write(d); });
      proc.stderr.on('data', d => { out += d; process.stderr.write(d); });
      proc.on('close', code => {
        if (code === 0) {
          // 再生成ファイルの duration と audioTs を manifest/scenes.json に反映
          updateDurationsAfterRegen(startTime);
        }
        json(res, { ok: code === 0, output: out });
      });
    } catch(e) { json(res, { error: e.message }, 500); }
    return;
  }

  // 全シーンの duration を一括再計測
  if (req.method === 'POST' && pathname === '/api/update-all-durations') {
    try {
      updateDurationsAfterRegen(0); // startTime=0 → 全ファイル対象
      json(res, { ok: true });
    } catch(e) { json(res, { error: e.message }, 500); }
    return;
  }

  // 音声ファイル配信
  if (req.method === 'GET' && pathname.startsWith('/audio/')) {
    const filename = decodeURIComponent(pathname.slice('/audio/'.length));
    serveAudio(res, path.join(AUDIO_DIR, filename));
    return;
  }

  // 画像アップロード
  if (req.method === 'POST' && pathname === '/api/upload-image') {
    try {
      const { filename, data } = await parseBody(req);
      const base64   = data.replace(/^data:[^;]+;base64,/, '');
      const buffer   = Buffer.from(base64, 'base64');
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const outPath  = path.join(IMAGES_DIR, safeName);
      fs.writeFileSync(outPath, buffer);
      json(res, { ok: true, path: `assets/washoku/images/${safeName}` });
    } catch(e) { json(res, { error: e.message }, 500); }
    return;
  }

  // 画像管理UI
  if (req.method === 'GET' && pathname === '/images') {
    const html = fs.readFileSync(IMAGES_UI_FILE, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // 利用可能な画像一覧
  if (req.method === 'GET' && pathname === '/api/images') {
    try {
      const files = fs.readdirSync(IMAGES_DIR)
        .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
        .sort()
        .map(f => `assets/washoku/images/${f}`);
      json(res, files);
    } catch(e) { json(res, [], 200); }
    return;
  }

  // 画像差し替え
  if (req.method === 'POST' && pathname === '/api/image-assign') {
    try {
      const { sceneId, newImage, applyToGroup } = await parseBody(req);

      const manifest = readJSON(MANIFEST_FILE);
      const target   = manifest.find(s => s.id === sceneId);
      if (!target) { json(res, { error: 'シーンが見つかりません' }, 404); return; }
      const oldImage = target.image;

      // manifest_final.json を更新
      manifest.forEach(s => {
        if (applyToGroup ? s.image === oldImage : s.id === sceneId) s.image = newImage;
      });
      fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');

      // scenes.json も同期
      if (fs.existsSync(SCENES_FILE)) {
        const scenes = readJSON(SCENES_FILE);
        scenes.forEach(s => {
          if (applyToGroup ? s.image === oldImage : s.id === sceneId) s.image = newImage;
        });
        fs.writeFileSync(SCENES_FILE, JSON.stringify(scenes, null, 2), 'utf8');
      }

      const updated = applyToGroup
        ? manifest.filter(s => s.image === newImage).length
        : 1;
      json(res, { ok: true, updated });
    } catch(e) { json(res, { error: e.message }, 500); }
    return;
  }

  // publicファイル配信（画像など）
  if (req.method === 'GET' && pathname.startsWith('/public/')) {
    const filePath = path.join(PUBLIC_DIR, decodeURIComponent(pathname.slice('/public/'.length)));
    if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.json': 'application/json; charset=utf-8' };
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type':   mime[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control':  'max-age=300',
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // テロップ一覧プレビュー
  if (req.method === 'GET' && pathname === '/telops') {
    try {
      const manifest = readJSON(MANIFEST_FILE);
      const CHAPTER_EXTRA_DELAY = 40;
      const IMAGE_GAP = 20;
      const SUBTITLE_GAP = 10;

      // buildImageGroups と同じロジックでフレーム位置を計算
      const rows = [];
      let globalFrame = 0;
      let i = 0;
      while (i < manifest.length) {
        const currentImage = manifest[i].image;
        const groupChapter = manifest[i].chapterTitle;
        const groupStart   = globalFrame;
        const extraDelay   = groupChapter ? CHAPTER_EXTRA_DELAY : 0;
        let relativeFrame  = IMAGE_GAP + extraDelay;
        let sceneIdx = 0;

        while (i < manifest.length && manifest[i].image === currentImage) {
          const d = manifest[i].durationInFrames || 90;
          if (sceneIdx > 0) { relativeFrame += SUBTITLE_GAP; globalFrame += SUBTITLE_GAP; }

          const absFrame = groupStart + relativeFrame;
          if (manifest[i].telop) {
            const delay    = manifest[i].telop.delay || 0;
            const showFrame = absFrame + delay;
            const totalSec  = showFrame / FPS;
            const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
            const ss = (totalSec % 60).toFixed(1).padStart(4, '0');
            rows.push({
              id:        manifest[i].id,
              subtitle:  manifest[i].subtitle.replace(/\n/g, ' '),
              telop:     manifest[i].telop,
              frame:     showFrame,
              timestamp: `${mm}:${ss}`,
              chapter:   groupChapter || '',
            });
          }
          relativeFrame += d;
          globalFrame   += d;
          i++; sceneIdx++;
        }
        globalFrame += IMAGE_GAP + extraDelay;
      }

      const typeLabel  = { emphasis:'強調', question:'疑問', supplement:'補足', card:'カード', number:'数字', vertical:'縦文字', stripe:'帯テロップ' };
      const colorStyle = { red:'#ff3030', yellow:'#fbbf24', white:'#ffffff', cyan:'#22d3ee' };

      const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<title>テロップ一覧</title>
<style>
  body { background:#111; color:#ddd; font-family:sans-serif; margin:0; padding:20px; }
  h1 { color:#fff; font-size:20px; margin-bottom:16px; }
  p.hint { color:#888; font-size:13px; margin-bottom:20px; }
  table { border-collapse:collapse; width:100%; font-size:14px; }
  th { background:#222; color:#aaa; padding:8px 12px; text-align:left; border-bottom:1px solid #333; position:sticky; top:0; }
  tr:hover td { background:#1a1a1a; }
  td { padding:8px 12px; border-bottom:1px solid #222; vertical-align:top; }
  .ts { font-family:monospace; font-size:16px; font-weight:bold; color:#60a5fa; cursor:pointer; white-space:nowrap; }
  .ts:hover { color:#93c5fd; text-decoration:underline; }
  .frame { font-family:monospace; font-size:11px; color:#555; }
  .telop-text { font-weight:bold; }
  .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:bold; color:#111; margin-right:4px; }
  .chapter-row td { background:#1c1a0a; color:#c8a455; font-size:12px; padding:4px 12px; }
</style>
</head><body>
<h1>📋 テロップ一覧</h1>
<p class="hint">タイムスタンプをクリック → コピーされます。Remotion Studio のタイムコード欄に貼り付けてジャンプ。</p>
<table>
<thead><tr><th>時間</th><th>シーンID</th><th>テロップ</th><th>種類</th><th>字幕</th></tr></thead>
<tbody>
${rows.map(r => {
  const tc   = typeLabel[r.telop.type] || r.telop.type;
  const col  = colorStyle[r.telop.color] || '#fff';
  const text = r.telop.text || (r.telop.items || []).join(' / ');
  const delayNote = r.telop.delay ? ` <span style="color:#666;font-size:11px">(+${(r.telop.delay/30).toFixed(1)}s遅延)</span>` : '';
  const chRow = r.chapter ? `<tr class="chapter-row"><td colspan="5">▶ ${r.chapter}</td></tr>` : '';
  return `${chRow}<tr>
    <td><span class="ts" onclick="navigator.clipboard.writeText('${r.frame}');this.style.color='#4ade80';setTimeout(()=>this.style.color='',1000)" title="クリックでフレーム番号コピー">${r.timestamp}</span><br><span class="frame">frame ${r.frame}</span></td>
    <td style="color:#888">${r.id}</td>
    <td class="telop-text" style="color:${col}">${text}${delayNote}</td>
    <td><span class="badge" style="background:${col}">${tc}</span>${r.telop.position ? `<span style="color:#666;font-size:11px">${r.telop.position}</span>` : ''}</td>
    <td style="color:#666;font-size:12px">${r.subtitle}</td>
  </tr>`;
}).join('\n')}
</tbody></table>
</body></html>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch(e) { res.writeHead(500); res.end(e.message); }
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n✅ 修正ツール起動: http://localhost:${PORT}`);
  console.log(`   テロップ一覧:   http://localhost:${PORT}/telops`);
  console.log('   ブラウザで開いてください。終了は Ctrl+C\n');
});
