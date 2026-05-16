import React, { useState, useEffect } from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, delayRender, continueRender } from 'remotion';
import { z } from 'zod';
import { KenBurns } from './KenBurns';
import { Subtitle } from './Subtitle';

// マニフェストの型定義
type KenBurnsParams = {
    fromScale: number;
    toScale: number;
    panX: number;
    panY: number;
};

type ManifestItem = {
    id: string;
    subtitle: string;
    audio: string;
    image: string;
    speaker: string;
    kenburns?: KenBurnsParams;
    durationSec: number;
    durationInFrames: number;
};

// Propsのスキーマ
export const FullCompositionSchema = z.object({
    subtitleBottom: z.number().default(80),
    subtitleFontSize: z.number().default(65),
    subtitleColor: z.string().default('#ffffff'),
    imgScale: z.number().default(1.04),
});

export const FullComposition: React.FC<z.infer<typeof FullCompositionSchema>> = ({
    subtitleBottom,
    subtitleFontSize,
    subtitleColor,
    imgScale,
}) => {
    const [handle] = useState(() => delayRender('マニフェスト読み込み中'));
    const [manifest, setManifest] = useState<ManifestItem[]>([]);

    useEffect(() => {
        const url = staticFile('assets/keiko-mitsuko-story/manifest_final.json') + '?t=' + Date.now();
        fetch(url)
            .then((res) => res.json())
            .then((data: ManifestItem[]) => {
                setManifest(data);
                continueRender(handle);
            })
            .catch((err) => {
                console.error('マニフェスト読み込みエラー:', err);
                continueRender(handle);
            });
    }, [handle]);

    if (manifest.length === 0) return null;

    let currentFrame = 0;

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            {manifest.map((item) => {
                const start = currentFrame;
                const durationFrames = item.durationInFrames || 90;
                currentFrame += durationFrames;

                // マニフェストのKen Burns情報を使用（なければデフォルト値）
                const kb = item.kenburns || { fromScale: 1.0, toScale: imgScale, panX: 0, panY: 0 };

                return (
                    <Sequence key={item.id} from={start} durationInFrames={durationFrames}>
                        {/* 背景画像（Ken Burns効果付き） */}
                        {item.image && (
                            <KenBurns
                                src={staticFile(item.image)}
                                fromScale={kb.fromScale}
                                toScale={kb.toScale}
                                imgScale={1.0}
                                imgX={kb.panX}
                                imgY={kb.panY}
                                effectType="slowZoom"
                            />
                        )}

                        {/* 字幕が読みやすくなるようにグラデーションを敷く */}
                        <AbsoluteFill
                            style={{
                                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 35%)',
                            }}
                        />

                        {/* 音声 */}
                        {item.audio && <Audio src={staticFile(item.audio)} {...({} as any)} />}

                        {/* 字幕 */}
                        {item.subtitle && (
                            <Subtitle
                                text={item.subtitle}
                                bottom={subtitleBottom}
                                fontSize={subtitleFontSize}
                                color={subtitleColor}
                            />
                        )}
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};
