const getDuration = require('mp3-duration');
const fs = require('fs');
const path = require('path');

const AUDIO_BASE = path.join(__dirname, '../public/assets/audio');
const TEXT_MAP_FILE = path.join(__dirname, '../src/text_map.json');
const MANIFEST_OUT = path.join(__dirname, '../src/manifest.json');

async function main() {
    console.log("Generating full manifest...");

    // Read text map
    if (!fs.existsSync(TEXT_MAP_FILE)) {
        console.error("Error: text_map.json not found. Run py script first.");
        return;
    }
    const textMap = JSON.parse(fs.readFileSync(TEXT_MAP_FILE, 'utf8'));

    const manifest = [];

    for (const item of textMap) {
        // Construct expected audio path
        // item.id is like ch1_sc01
        // We need ch1_sc01.mp3 in public/audio/chapter1/

        // Parse chapter from ID or item.chapter
        const ch = item.chapter || 1;
        const filename = `${item.id}.mp3`;
        const filePath = path.join(AUDIO_BASE, `chapter${ch}`, filename);

        let duration = 5.0; // Default
        let fileExists = false;

        try {
            if (fs.existsSync(filePath)) {
                duration = await getDuration(filePath);
                fileExists = true;
                // Add buffer? No, exact duration.
            } else {
                console.warn(`Missing audio: ${filePath}`);
            }
        } catch (e) {
            console.error(`Error reading audio ${filePath}:`, e);
        }

        // We want the path relative to 'public' for staticFile()
        // file: assets/audio/chapter1/ch1_sc01.mp3
        const relativePath = `assets/audio/chapter${ch}/${filename}`;

        manifest.push({
            id: item.id,
            chapter: ch,     // New field for filtering
            text: item.text,
            file: fileExists ? relativePath : null,
            duration: duration
        });

        // Console log progress
        // console.log(`${item.id}: ${duration.toFixed(2)}s`);
    }

    fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
    // Also save to public for runtime fetching
    fs.writeFileSync(path.join(__dirname, '../public/manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(`Saved manifest to src/manifest.json and public/manifest.json with ${manifest.length} items.`);
}

main();
