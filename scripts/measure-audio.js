const getDuration = require('mp3-duration');
const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, '../public/audio/ch1');
const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));

async function main() {
    console.log("Measuring durations...");
    const durations = {};
    for (const file of files) {
        try {
           const duration = await getDuration(path.join(audioDir, file));
           durations[file] = duration;
           console.log(`${file}: ${duration}`);
        } catch (e) {
            console.error(`Error reading ${file}:`, e);
            durations[file] = 5; // Fallback
        }
    }
    
    // Add placeholder for missing file
    if (!durations['ch1_04_michiko_line.mp3']) {
        durations['ch1_04_michiko_line.mp3'] = 5;
        console.log("Added placeholder for ch1_04_michiko_line.mp3: 5");
    }

    fs.writeFileSync(path.join(__dirname, 'audio-durations.json'), JSON.stringify(durations, null, 2));
    console.log("Saved to audio-durations.json");
}

main();
