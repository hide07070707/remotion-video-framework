const fs = require('fs');
const path = require('path');
const mp3Duration = require('mp3-duration');

const MANIFEST_PATH = path.join(__dirname, '../public/assets/keiko-mitsuko-story/audio_manifest.json');
const OUT_PATH = path.join(__dirname, '../public/assets/keiko-mitsuko-story/manifest_final.json');
const AUDIO_DIR = path.join(__dirname, '../public');

const FPS = 30;
const BUFFER_FRAMES = 15; // 音声終了後に0.5秒余韻

async function main() {
    const rawData = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(rawData);

    const finalManifest = [];

    for (const item of manifest) {
        const audioPath = path.join(AUDIO_DIR, item.audio);
        if (!fs.existsSync(audioPath)) {
            console.warn(`[WARN] Audio not found: ${item.audio}`);
            continue;
        }

        try {
            const durationSec = await mp3Duration(audioPath);
            const durationInFrames = Math.ceil(durationSec * FPS) + BUFFER_FRAMES;

            finalManifest.push({
                id: item.id,
                subtitle: item.subtitle,
                audio: item.audio,
                image: item.image,  // audio_manifest.jsonに既に含まれている
                speaker: item.speaker,
                kenburns: item.kenburns || { fromScale: 1.0, toScale: 1.06, panX: 0, panY: 0 },
                durationSec: durationSec,
                durationInFrames: durationInFrames
            });
            console.log(`${item.id}: ${durationSec.toFixed(2)}s (${durationInFrames}fr) - ${item.image}`);
        } catch (e) {
            console.error(`[ERROR] ${item.id}:`, e.message);
        }
    }

    fs.writeFileSync(OUT_PATH, JSON.stringify(finalManifest, null, 2), 'utf-8');
    console.log(`\n✅ ${finalManifest.length} segments saved to manifest_final.json`);
}

main();
