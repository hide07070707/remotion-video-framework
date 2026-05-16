import React from 'react';
import {
    AbsoluteFill,
    Img,
    staticFile,
    useVideoConfig,
    useCurrentFrame,
    interpolate,
} from 'remotion';
import { Subtitle } from './Subtitle';
import { z } from 'zod';

// props用のスキーマ定義（Vibe Coding / Propsパネル用）
export const keikoMitsukoSchema = z.object({
    titleText: z.string(),
    subtitleText: z.string(),
    imgScale: z.number().min(0.5).max(3).step(0.1),
    imgX: z.number().min(-1000).max(1000).step(10),
    imgY: z.number().min(-1000).max(1000).step(10),
});

export type KeikoMitsukoProps = z.infer<typeof keikoMitsukoSchema>;

export const KeikoMitsukoMVP: React.FC<KeikoMitsukoProps> = ({
    titleText,
    subtitleText,
    imgScale,
    imgX,
    imgY,
}) => {
    const { fps, durationInFrames, width, height } = useVideoConfig();
    const frame = useCurrentFrame();

    // ゆっくりとしたズームイン効果（オプション）
    const scale = interpolate(
        frame,
        [0, durationInFrames],
        [imgScale, imgScale * 1.05],
        { extrapolateRight: 'clamp' }
    );

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            {/* 背景画像 */}
            <AbsoluteFill
                style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Img
                    // 指定フォルダの最初の画像を使用 (アセット存在確認)
                    src={staticFile('assets/keiko-mitsuko-story/sc_01_p1.png')}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `scale(${scale}) translate(${imgX}px, ${imgY}px)`,
                    }}
                    {...({} as any) /* 型エラー回避のため */}
                />
            </AbsoluteFill>

            {/* グラデーションオーバーレイ（テキストを読みやすくするため） */}
            <AbsoluteFill
                style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 40%)',
                }}
            />

            {/* タイトル（上部） */}
            <AbsoluteFill
                style={{
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    paddingTop: '100px',
                }}
            >
                <div
                    style={{
                        fontFamily: '"Noto Serif JP", serif',
                        fontSize: '80px',
                        color: 'white',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        width: '90%',
                    }}
                >
                    {titleText}
                </div>
            </AbsoluteFill>

            {/* 字幕（下部 - Subtitleコンポーネントを使用） */}
            <AbsoluteFill
                style={{
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    paddingBottom: '100px',
                }}
            >
                {/*
          字幕は画面幅の90%以下、中央揃えを徹底。
          Subtitleコンポーネントがこれを担保することが望ましい。
        */}
                <Subtitle text={subtitleText} />
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
