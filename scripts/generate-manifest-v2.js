const getDuration = require('mp3-duration');
const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, '../public/audio/ch1_v2');

// OFFICIAL SCRIPT V2 (17 Segments)
const scriptData = [
    { id: "ch1_v2_01", file: "ch1_v2_01.mp3", text: "六十五歳になって知ったのは、朝の静寂がいかに贅沢な果実であるかということだ。" },
    { id: "ch1_v2_02", file: "ch1_v2_02.mp3", text: "午前七時。夫がゴルフに出かけた後のキッチンには、古い柱時計のカチコチという規則正しい音だけが満ちている。" },
    { id: "ch1_v2_03", file: "ch1_v2_03.mp3", text: "陽子は、お気に入りの、少し縁が欠けたボーンチャイナのカップに珈琲を注いだ。" },
    { id: "ch1_v2_04", file: "ch1_v2_04.mp3", text: "湯気と共に立ち上る深い苦味のある香りが、まだ眠たがっている肺の奥までゆっくりと染み渡っていく。" },
    { id: "ch1_v2_05", file: "ch1_v2_05.mp3", text: "窓の外では、庭の隅に植えた山茶花が、冷え込み始めた朝の空気の中で静かに身を縮めている。" },
    { id: "ch1_v2_06", file: "ch1_v2_06.mp3", text: "「……やっと、自分の時間が持てるようになったのよね」" },
    { id: "ch1_v2_07", file: "ch1_v2_07.mp3", text: "陽子は誰に言うでもなく呟き、温かいカップを両手で包み込んだ。陶器の適度な重みが、掌を通して「今、ここに自分がいる」という確かな感覚を伝えてくる。" },
    // 08 is SE (Vibration)
    { id: "ch1_v2_08", file: null, text: "", duration: 2.0, isGap: true },
    { id: "ch1_v2_09", file: "ch1_v2_09.mp3", text: "スマートフォンの画面が明るく光り、通知欄に「美智子」の名前が浮かび上がる。陽子の心臓が、かすかに、けれど嫌な早さで脈打った。" },
    { id: "ch1_v2_10", file: "ch1_v2_10.mp3", text: "陽子さん、おはよう！今日、いつものイタリアン、十一時半で大丈夫よね？楽しみにしてるわね" },
    { id: "ch1_v2_11", file: "ch1_v2_11.mp3", text: "陽子はスマートフォンの画面をじっと見つめる。（断ろうか……。今日は、一人の時間が欲しかったの）" },
    { id: "ch1_v2_12", file: "ch1_v2_12.mp3", text: "結局、五分後に彼女が送ったのは、短い同意の返事だった。『了解しました。私も楽しみにしてるわね』" },
    { id: "ch1_v2_13", file: "ch1_v2_13.mp3", text: "送信ボタンを押した瞬間、陽子は深い、深い溜息をついた。" },
    { id: "ch1_v2_14", file: "ch1_v2_14.mp3", text: "陽子の役割は、いつも決まっていた。「そうなの」「それは大変だったわね」そんな相槌のカードを、タイミングよく差し出すだけの「聞き役」。" },
    { id: "ch1_v2_15", file: "ch1_v2_15.mp3", text: "（私は、美智子さんの心のゴミ箱じゃない）喉の奥まで出かかったその言葉を、陽子は再び珈琲と一緒に飲み込んだ。" },
    { id: "ch1_v2_16", file: "ch1_v2_16.mp3", text: "「大丈夫。たった二時間の我慢よ。それが終われば、また一人の時間に戻れるんだから……」" },
    { id: "ch1_v2_17", file: "ch1_v2_17.mp3", text: "陽子は、まだ重い体を引きずるようにして、二階のクローゼットへ向かった。「優しい人」という仮面を被るために、今日着ていく服を選ばなければならなかった。" }
];

async function main() {
    console.log("Generating manifest V2 with durations...");
    const manifest = [];

    for (const item of scriptData) {
        if (item.file) {
            const filePath = path.join(audioDir, item.file);
            try {
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
            // Gap / SE
            manifest.push({ ...item });
        }
    }

    const outputPath = path.join(__dirname, '../src/manifest.json');
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
    console.log(`Saved manifest to ${outputPath}`);
}

main();
