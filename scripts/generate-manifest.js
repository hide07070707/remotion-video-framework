const getDuration = require('mp3-duration');
const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, '../public/audio/ch1');

// Script Data (Manually extracted from generate_ch1_audio.py)
const scriptData = [
    { id: "ch1_01", file: "ch1_01_narration.mp3", text: "陽子は、いつものようにキッチンでコーヒーを淹れていた。毎朝のルーティン。豆を挽き、フィルターにお湯を注ぐ。立ち上る湯気と香りが、彼女の小さな聖域を満たしていく。窓の外には、手入れの行き届いた小さな庭。季節外れの椿が、一輪だけ咲いているのが見える。" },
    { id: "ch1_02", file: "ch1_02_yoko_monologue.mp3", text: "（さて、今日は何をしようかしら。美智子さんとのランチは12時からだから…それまでは、私の時間）" },
    { id: "gap_03", file: null, text: "", duration: 2.0 }, // Silence
    { id: "ch1_04", file: "ch1_04_michiko_line.mp3", text: "陽子さん、おはよう！今日、いつものイタリアン、十一時半で大丈夫よね？楽しみにしてるわね" }, // Updated text/file
    { id: "ch1_05", file: "ch1_05_narration.mp3", text: "一瞬、陽子の動きが止まる。12時と言っていたはずだ。カレンダーにもそうメモしてある。些細な変更。だが、陽子の胸の奥で、小さな歯車が不協和音を立て始める。急いで準備しなければならない。静かな朝の時間は、唐突に終わりを告げた。" },
    { id: "ch1_06", file: "ch1_06_yoko_internal.mp3", text: "（えっ…十一時半？聞いてないわ。準備、間に合うかしら）" },
    { id: "ch1_07", file: "ch1_07_narration.mp3", text: "陽子は慌てて返信を打つ。" },
    { id: "ch1_08", file: "ch1_08_yoko_internal_b.mp3", text: "（大丈夫よ、楽しみにしてる。…送信、と）" },
    { id: "ch1_09", file: "ch1_09_narration.mp3", text: "送信ボタンを押す指先が、ほんの少し震えた気がした。美智子は悪くない。いつも少しせっかちで、悪気なく予定を変える昔からの友人だ。でも、陽子にとっては、この「小さなズレ」が、なぜか今日に限って、ひどく不安だった。" },
    { id: "ch1_10", file: "ch1_10_yoko_draft.mp3", text: "（私、最近、こういう急な変更に弱くなってる気がする…）" },
    { id: "ch1_11", file: "ch1_11_narration.mp3", text: "鏡の前で化粧を直しながら、陽子は自分に問いかける。" },
    { id: "ch1_12", file: "ch1_12_yoko_reply.mp3", text: "（しっかりしなきゃ。ただの30分の変更じゃない）" },
    { id: "ch1_13", file: "ch1_13_narration.mp3", text: "家の鍵を閉め、通りに出る。いつもの見慣れた景色。だが、陽子の目には、少しだけ色が褪せて見えた。向かいの公園では、若い母親が子供を遊ばせている。その屈託のない笑い声が、今の陽子には少し眩しすぎた。" },
    { id: "ch1_14", file: "ch1_14_yoko_response.mp3", text: "（あのお母さん、前にも見たことあるわね。…あれ？）" },
    { id: "ch1_15", file: "ch1_15_narration.mp3", text: "ふと、違和感を覚える。その母親の顔。どこかで見たような、でも全く知らないような。記憶のピントが合わない感覚。" },
    { id: "ch1_16", file: "ch1_16_yoko_internal_c.mp3", text: "（私、疲れてるのかしら）" },
    { id: "ch1_17", file: "ch1_17_narration.mp3", text: "駅へと続く並木道。風が冷たい。コートの襟を立てながら、陽子は早足になる。約束の時間に遅れてはいけない。それは、陽子が長年守り続けてきた、彼女の「規律」だった。" },
    { id: "ch1_18", file: "ch1_18_yoko_self.mp3", text: "（大丈夫。私は大丈夫。いつも通りよ）" },
    { id: "ch1_19", file: "ch1_19_narration_end.mp3", text: "そう言い聞かせながらも、陽子の足取りは、どこか心もとない。まるで、踏みしめる地面が、少しずつ砂に変わっていくような、そんな頼りなさを感じていた。" }
];

async function main() {
    console.log("Generating manifest with durations...");
    const manifest = [];

    for (const item of scriptData) {
        if (item.file) {
            const filePath = path.join(audioDir, item.file);
            try {
                // Check if file exists
                if (fs.existsSync(filePath)) {
                    const durationInSeconds = await getDuration(filePath);
                    manifest.push({
                        ...item,
                        duration: durationInSeconds
                    });
                    console.log(`${item.file}: ${durationInSeconds}s`);
                } else {
                    console.error(`File missing: ${item.file}`);
                    manifest.push({ ...item, duration: 5.0, error: "Missing" });
                }
            } catch (e) {
                console.error(`Error reading ${item.file}:`, e);
                manifest.push({ ...item, duration: 5.0, error: "Error" });
            }
        } else {
            // Gap handling
            manifest.push({ ...item });
        }
    }

    const outputPath = path.join(__dirname, '../src/manifest.json');
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
    console.log(`Saved manifest to ${outputPath}`);
}

main();
