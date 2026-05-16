const getDuration = require('mp3-duration');
const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, '../public/audio/ch1_perfect');

// PERFECT SCRIPT (38 Segments)
const scriptData = [
    { id: "ch1_p_01", file: "ch1_p_01.mp3", text: "六十五歳になって知ったのは、朝の静寂がいかに贅沢な果実であるかということだ。" },
    { id: "ch1_p_02", file: "ch1_p_02.mp3", text: "午前七時。夫がゴルフに出かけた後のキッチンには、古い柱時計のカチコチという規則正しい音だけが満ちている。" },
    { id: "ch1_p_03", file: "ch1_p_03.mp3", text: "陽子は、お気に入りの、少し縁が欠けたボーンチャイナのカップに珈琲を注いだ。" },
    { id: "ch1_p_04", file: "ch1_p_04.mp3", text: "湯気と共に立ち上る深い苦味のある香りが、まだ眠たがっている肺の奥までゆっくりと染み渡っていく。" },
    { id: "ch1_p_05", file: "ch1_p_05.mp3", text: "窓の外では、庭の隅に植えた山茶花（さざんか）が、冷え込み始めた朝の空気の中で静かに身を縮めている。" },
    { id: "ch1_p_06", file: "ch1_p_06.mp3", text: "かつては、この時間は戦場だった。子供たちのお弁当作り、夫のワイシャツのアイロンがけ、自分自身の出勤準備。分刻みのスケジュールに追われ、珈琲の味など感じたこともなかった。" },
    { id: "ch1_p_07", file: "ch1_p_07.mp3", text: "「……やっと、自分の時間が持てるようになったのよね」" },
    { id: "ch1_p_08", file: "ch1_p_08.mp3", text: "陽子は誰に言うでもなく呟き、温かいカップを両手で包み込んだ。陶器の適度な重みが、掌を通して「今、ここに自分がいる」という確かな感覚を伝えてくる。" },
    { id: "ch1_p_09", file: "ch1_p_09.mp3", text: "今日という一日は、誰にも邪魔されないはずだった。読もうと思って机に置いたままの、少し厚手の長編小説。午後は庭の枯れ葉を掃除して、夕食は自分のためだけに簡単なポトフでも作ろう。" },
    // 10 is SE (Phone Vibe) - Shortened gap for tempo
    { id: "ch1_p_10", file: null, text: "", duration: 0.5, isGap: true },
    { id: "ch1_p_11", file: "ch1_p_11.mp3", text: "そんな、ささやかで、けれど宝石のように輝く計画が、テーブルの上で低く震えた機械音によって、一瞬にして粉砕された。" },
    { id: "ch1_p_12", file: "ch1_p_12.mp3", text: "スマートフォンの画面が明るく光り、通知欄に「美智子」の名前が浮かび上がる。" },
    { id: "ch1_p_13", file: "ch1_p_13.mp3", text: "陽子の心臓が、かすかに、けれど嫌な早さで脈打った。それは期待ではなく、どちらかといえば「警報」に近い反応だった。" },
    { id: "ch1_p_14", file: "ch1_p_14.mp3", text: "陽子さん、おはよう！今日、いつものイタリアン、十一時半で大丈夫よね？楽しみにしてるわね" },
    { id: "ch1_p_15", file: "ch1_p_15.mp3", text: "LINEの文末には、華やかな花のスタンプが添えられている。陽子は、半分まで飲んだ珈琲をテーブルに置いた。" },
    { id: "ch1_p_16", file: "ch1_p_16.mp3", text: "先ほどまであんなに芳醇だった香りが、急に鼻につくような、重苦しいものに変わった気がした。" },
    { id: "ch1_p_17", file: "ch1_p_17.mp3", text: "美智子は、中学時代からの古い友人だ。お互いに結婚し、子育てに追われ、しばらく疎遠になっていた時期もあったが、還暦を過ぎた頃から「お互い自由になったんだから」と、月に一度のランチが定例になっていた。" },
    { id: "ch1_p_18", file: "ch1_p_18.mp3", text: "陽子はスマートフォンの画面をじっと見つめる。（断ろうか……。今日は、一人の時間が欲しかったの）" },
    { id: "ch1_p_19", file: "ch1_p_19.mp3", text: "そう思う一方で、脳内の「真面目な陽子」がすぐに反論を始める。『負い目を感じる必要はないはず。でも、美智子さんはあんなに楽しみにしてくれている。断る正当な理由があるの？』" },
    { id: "ch1_p_20", file: "ch1_p_20.mp3", text: "カレンダーの今日の欄は、真っ白だ。仕事があるわけでも、親の介護があるわけでもない。" },
    { id: "ch1_p_21", file: "ch1_p_21.mp3", text: "ただ「一人でいたいから」という理由は、美智子のような社交的な人間にとって、拒絶と同じ意味を持ってしまうのではないか。" },
    { id: "ch1_p_22", file: "ch1_p_22.mp3", text: "陽子は、返信の文字を打とうとしては消し、打とうとしては消した。" },
    { id: "ch1_p_23", file: "ch1_p_23.mp3", text: "「ごめんなさい、今日は少し体調が……」と打ちかけて、嘘をつく自分への嫌悪感に指が止まる。" },
    { id: "ch1_p_24", file: "ch1_p_24.mp3", text: "結局、五分後に彼女が送ったのは、短い同意の返事だった。『了解しました。私も楽しみにしてるわね』" },
    { id: "ch1_p_25", file: "ch1_p_25.mp3", text: "送信ボタンを押した瞬間、陽子は深い、深い溜息をついた。窓の外の光は変わらず明るいのに、キッチンは急に、冷え冷えとした薄暗い檻のように感じられた。" },
    { id: "ch1_p_26", file: "ch1_p_26.mp3", text: "美智子と会うのは、嫌いではないはずだった。少なくとも数年前までは。" },
    { id: "ch1_p_27", file: "ch1_p_27.mp3", text: "けれど、最近の美智子との時間は、まるで自分の心という部屋を、他人の脱ぎ捨てた汚れた服でいっぱいにされるような、そんな重苦しさを伴うようになっていた。" },
    { id: "ch1_p_28", file: "ch1_p_28.mp3", text: "彼女は会うなり、一気に話し始める。同居しているお嫁さんの掃除の仕方が気に入らないこと、夫がいかに自分を蔑ろにしているか、そして、最近通い始めた病院の医師の態度がいかに失礼だったか。" },
    { id: "ch1_p_29", file: "ch1_p_29.mp3", text: "陽子の役割は、いつも決まっていた。「そうなの」「それは大変だったわね」「美智子さんは十分頑張っているわよ」" },
    { id: "ch1_p_30", file: "ch1_p_30.mp3", text: "そんな相槌のカードを、タイミングよく差し出すだけの「聞き役」。" },
    { id: "ch1_p_31", file: "ch1_p_31.mp3", text: "美智子はランチが終わる頃には、「陽子さんと話すとスッキリするわ！」と、まるで憑き物が落ちたような晴れやかな顔で帰っていく。" },
    { id: "ch1_p_32", file: "ch1_p_32.mp3", text: "一方で、陽子は帰宅した途端、泥のような疲労感に襲われ、夕食を作る気力すら失って寝込んでしまうのが常だった。" },
    { id: "ch1_p_33", file: "ch1_p_33.mp3", text: "（私は、美智子さんの心のゴミ箱じゃない）" },
    { id: "ch1_p_34", file: "ch1_p_34.mp3", text: "喉の奥まで出かかったその言葉を、陽子は再び珈琲と一緒に飲み込んだ。" },
    { id: "ch1_p_35", file: "ch1_p_35.mp3", text: "時計の針は、もうすぐ八時を指そうとしている。約束の時間まで、あと三時間半。" },
    { id: "ch1_p_36", file: "ch1_p_36.mp3", text: "陽子は、お気に入りのカップを流し台へ運んだ。洗剤の泡でカップを洗う指先が、わずかに震えている。" },
    { id: "ch1_p_37", file: "ch1_p_37.mp3", text: "「大丈夫。たった二時間の我慢よ。それが終われば、また一人の時間に戻れるんだから……」" },
    { id: "ch1_p_38", file: "ch1_p_38.mp3", text: "自分に言い聞かせる言葉が、空虚にキッチンの壁に跳ね返った。陽子は、まだ重い体を引きずるようにして、二階のクローゼットへ向かった。「優しい人」という仮面を被るために、今日着ていく服を選ばなければならなかった。" }
];

async function main() {
    console.log("Generating manifest Perfect with durations...");
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
