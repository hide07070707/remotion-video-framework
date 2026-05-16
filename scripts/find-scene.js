/**
 * find-scene.js
 * シーンIDからリモーションスタジオのフレーム番号・時刻を逆引きします
 *
 * 使い方:
 *   node scripts/find-scene.js sc_104
 *   node scripts/find-scene.js shake        ← textStyle=shake のシーン一覧
 *   node scripts/find-scene.js memo         ← doctorMemo があるシーン一覧
 *   node scripts/find-scene.js chapter      ← chapterTitle があるシーン一覧
 *   node scripts/find-scene.js list         ← 全シーン一覧
 */

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, '../public/assets/washoku/manifest_final.json');
const FPS = 30;
const IMAGE_SWITCH_GAP = 20;
const SUBTITLE_GAP = 10;
const CHAPTER_EXTRA_DELAY = 40;

function toTimecode(frame) {
    const totalSec = Math.floor(frame / FPS);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}分${String(s).padStart(2, '0')}秒ごろ`;
}

function buildSceneIndex(data) {
    const index = [];
    let globalFrame = 0;
    let groupIndex = 0;
    let i = 0;

    while (i < data.length) {
        const currentImage = data[i].image;
        const groupChapter = data[i].chapterTitle;
        const extraDelay = groupChapter ? CHAPTER_EXTRA_DELAY : 0;
        const groupStart = globalFrame;
        let relativeFrame = IMAGE_SWITCH_GAP + extraDelay;
        let sceneIndexInGroup = 0;

        while (i < data.length && data[i].image === currentImage) {
            const d = data[i].durationInFrames || 90;

            if (sceneIndexInGroup > 0) {
                relativeFrame += SUBTITLE_GAP;
                globalFrame += SUBTITLE_GAP;
            }

            const absFrame = groupStart + relativeFrame;
            index.push({
                id: data[i].id,
                subtitle: data[i].subtitle || '',
                textStyle: data[i].textStyle || '',
                doctorMemo: data[i].doctorMemo || '',
                chapterTitle: data[i].chapterTitle || '',
                annotation: data[i].annotation || '',
                frame: absFrame,
                timecode: toTimecode(absFrame),
                durationFrames: d,
                image: data[i].image,
            });

            relativeFrame += d;
            globalFrame += d;
            i++;
            sceneIndexInGroup++;
        }

        globalFrame += IMAGE_SWITCH_GAP + extraDelay;
        groupIndex++;
    }

    return index;
}

const data = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
const index = buildSceneIndex(data);

const query = process.argv[2] || '';

function printScene(s) {
    const tags = [s.textStyle, s.doctorMemo ? 'memo' : '', s.chapterTitle ? 'chapter' : '', s.annotation ? 'annot' : '']
        .filter(Boolean).join('/');
    const sub = s.subtitle.replace(/\n/g, ' / ').slice(0, 40);
    const tagStr = tags ? `[${tags}] ` : '';
    console.log(`  ${s.id}  ${s.timecode}  ${tagStr}${sub}`);
}

if (!query) {
    console.log('使い方: node scripts/find-scene.js <シーンID または shake/memo/chapter/list>');
    process.exit(0);
}

if (query === 'list') {
    console.log(`全 ${index.length} シーン:\n`);
    index.forEach(printScene);
} else if (query === 'shake') {
    const results = index.filter(s => s.textStyle === 'shake');
    console.log(`shake シーン (${results.length}件):\n`);
    results.forEach(printScene);
} else if (query === 'memo') {
    const results = index.filter(s => s.doctorMemo);
    console.log(`doctorMemo シーン (${results.length}件):\n`);
    results.forEach(printScene);
} else if (query === 'chapter') {
    const results = index.filter(s => s.chapterTitle);
    console.log(`chapterTitle シーン (${results.length}件):\n`);
    results.forEach(printScene);
} else if (query === 'emphasis') {
    const results = index.filter(s => s.textStyle === 'emphasis');
    console.log(`emphasis シーン (${results.length}件):\n`);
    results.forEach(printScene);
} else {
    // シーンID直接検索（部分一致）
    const results = index.filter(s => s.id.includes(query));
    if (results.length === 0) {
        console.log(`"${query}" に一致するシーンが見つかりません`);
    } else {
        results.forEach(printScene);
    }
}
