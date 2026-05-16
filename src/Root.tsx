import React from 'react';
import { Composition, staticFile } from 'remotion';

import { KeikoMitsukoMVP, keikoMitsukoSchema } from './KeikoMitsukoMVP';
import { FullComposition, FullCompositionSchema } from './FullComposition';
import { WashokuComposition, WashokuSchema, countImageGroups, countChapterGroups, CHAPTER_EXTRA_DELAY } from './WashokuComposition';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="KeikoMitsukoMVP"
                component={KeikoMitsukoMVP}
                durationInFrames={300}
                fps={30}
                width={1080}
                height={1920}
                schema={keikoMitsukoSchema}
                defaultProps={{
                    titleText: '恵子と美津子の物語',
                    subtitleText: '本当の豊かさと投資家の覚悟',
                    imgScale: 1.0,
                    imgX: 0,
                    imgY: 0,
                }}
            />

            {/* 本番用フルコンポジション */}
            <Composition
                id="FullStory"
                component={FullComposition}
                durationInFrames={5000}
                fps={30}
                width={1920}
                height={1080}
                schema={FullCompositionSchema}
                defaultProps={{
                    subtitleBottom: 80,
                    subtitleFontSize: 65,
                    subtitleColor: '#ffffff',
                    imgScale: 1.04,
                }}
                calculateMetadata={async () => {
                    const url = staticFile('assets/keiko-mitsuko-story/manifest_final.json');
                    try {
                        const res = await fetch(url);
                        if (res.ok) {
                            const data = await res.json();
                            const totalFrames = data.reduce(
                                (acc: number, item: any) => acc + (item.durationInFrames || 90),
                                0
                            );
                            return { durationInFrames: totalFrames > 0 ? totalFrames : 5000 };
                        }
                    } catch (e) {
                        console.error('マニフェスト読み込みエラー（calculateMetadata）:', e);
                    }
                    return { durationInFrames: 5000 };
                }}
            />
            {/* 節子の和食ストーリー */}
            <Composition
                id="WashokuStory"
                component={WashokuComposition}
                durationInFrames={43300}
                fps={30}
                width={1920}
                height={1080}
                schema={WashokuSchema}
                defaultProps={{
                    subtitleBottom:        80,
                    subtitleFontSize:      62,
                    subtitleColor:         '#ffffff',
                    imageSwitchGapFrames:  20,
                    subtitleGapFrames:     10,
                }}
                calculateMetadata={async ({ props }) => {
                    const imageGap    = props.imageSwitchGapFrames ?? 20;
                    const subtitleGap = props.subtitleGapFrames    ?? 10;
                    const url = staticFile('assets/washoku/manifest_final.json');
                    try {
                        const res = await fetch(url);
                        if (res.ok) {
                            const data = await res.json();
                            const sceneTotal  = data.reduce(
                                (acc: number, item: any) => acc + (item.durationInFrames || 90),
                                0
                            );
                            const numGroups   = countImageGroups(data);
                            const numChapters = countChapterGroups(data);
                            // テロップ切替ギャップ = (総シーン数 - グループ数) 箇所
                            const subtitleGaps  = (data.length - numGroups) * subtitleGap;
                            const chapterDelay  = numChapters * CHAPTER_EXTRA_DELAY;
                            const total = sceneTotal + numGroups * imageGap + subtitleGaps + chapterDelay;
                            return { durationInFrames: total > 0 ? total : 43300 };
                        }
                    } catch (e) {
                        console.error('washoku manifest error:', e);
                    }
                    return { durationInFrames: 43300 };
                }}
            />
        </>
    );
};
