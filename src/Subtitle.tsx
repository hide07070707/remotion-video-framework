import React from 'react';
import { useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

type TextStyleType = 'center' | 'emphasis' | 'shake';

const SPEAKER_CONFIG: Record<string, { color: string; side: 'left' | 'right' }> = {
    setsuko: { color: '#e05080', side: 'right' },  // 節子：右
    doctor:  { color: '#2563eb', side: 'left'  },  // 医師：左
    husband: { color: '#16a34a', side: 'left'  },  // 夫：左
    mother:  { color: '#d97706', side: 'right' },  // 節子の母：右
    unknown: { color: '#7c3aed', side: 'right' },  // 話者不明の「」セリフ
};

const BUBBLE_LINE_HEIGHT = 1.55;

// マンガ風縦書き吹き出し（名前・三角なし、左右位置あり）
const SpeechBubble: React.FC<{
    text: string;
    cfg: { color: string; side: 'left' | 'right' };
    fontSize: number;
    bottom: number;
    opacity: number;
}> = ({ text, cfg, fontSize, bottom, opacity }) => {
    const { height: videoHeight } = useVideoConfig();

    const PAD_V      = 44;  // バブル上下パディング合計
    const MARGIN_TOP = 80;  // 画面上端に残すマージン

    const vFontSize     = Math.round(fontSize * 0.82);
    const maxBubbleH    = videoHeight - bottom - PAD_V - MARGIN_TOP;
    const maxCharsPerCol = Math.max(4, Math.floor(maxBubbleH / (vFontSize * BUBBLE_LINE_HEIGHT)));

    // 長い行を自動分割して複数列に（均等分配で孤立文字を防ぐ）
    // 縦書きで横倒しになるダッシュ系文字を縦書き専用文字（U+FE31）に変換
    const normalizedText = text
        .replace(/——/g, '︱︱')
        .replace(/—/g,       '︱')
        .replace(/――/g, '︱︱')
        .replace(/―/g,       '︱')
        .replace(/──/g, '︱︱')
        .replace(/─/g,       '︱');
    const rawLines = normalizedText.split(/<br\s*\/?>/i);
    const processedLines: string[] = rawLines.flatMap((seg) => {
        const chars = [...seg];
        if (chars.length <= maxCharsPerCol) return [seg];  // seg は normalizedText 由来
        const numCols = Math.ceil(chars.length / maxCharsPerCol);
        const balanced = Math.ceil(chars.length / numCols);
        const chunks: string[] = [];
        for (let i = 0; i < chars.length; i += balanced) {
            chunks.push(chars.slice(i, i + balanced).join(''));
        }
        return chunks;
    });

    const posStyle: React.CSSProperties = cfg.side === 'left'
        ? { left: '3%' }
        : { right: '3%' };

    return (
        <div
            style={{
                position: 'absolute',
                bottom,
                ...posStyle,
                opacity,
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    background: 'rgba(255,255,255,0.97)',
                    border: `5px solid ${cfg.color}`,
                    borderRadius: 16,
                    padding: '20px 18px',
                    writingMode: 'vertical-rl',
                    textOrientation: 'upright',
                    whiteSpace: 'nowrap',
                    fontSize: vFontSize,
                    fontWeight: 'bold',
                    color: '#111',
                    fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
                    lineHeight: BUBBLE_LINE_HEIGHT,
                }}
            >
                {processedLines.map((line, i, arr) => (
                    <React.Fragment key={i}>
                        {line}
                        {i !== arr.length - 1 && <br />}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export const Subtitle: React.FC<{
    text: string;
    bottom?: number;
    fontSize?: number;
    color?: string;
    fadeInFrames?: number;
    textStyle?: TextStyleType;
    shakeFontFamily?: string;
    speaker?: string;
}> = ({ text, bottom = 80, fontSize = 70, color = 'white', fadeInFrames = 8, textStyle, shakeFontFamily, speaker }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const isCenter   = textStyle === 'center';
    const isEmphasis = textStyle === 'emphasis';
    const isShake    = textStyle === 'shake';

    const effectiveFadeFrames = isCenter ? 14 : fadeInFrames;
    const fadeOutFrames = 6;
    const effectiveFontSize   = isCenter ? fontSize * 1.35
                              : isEmphasis ? fontSize * 1.1
                              : isShake    ? fontSize * 1.1
                              : fontSize;
    const effectiveColor      = isEmphasis ? '#fbbf24'
                              : isShake    ? '#ffffff'
                              : color;

    const fadeIn  = interpolate(frame, [0, effectiveFadeFrames], [0, 1], { extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [durationInFrames - fadeOutFrames, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    const opacity    = fadeIn * fadeOut;

    const baseTransform  = isCenter ? 'translateY(-50%)' : '';
    const finalTransform = baseTransform || undefined;

    const baseTextShadow = '-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000, 4px 4px 0 #000';
    const glowShadow = '';

    if (!text) return null;

    // マンガ風縦書き吹き出し（通常セリフのみ）
    // speaker未指定でも「」で囲まれたテキストは自動的に吹き出し表示
    const isDialogue = !speaker && /^「/.test(text.trim());
    const effectiveSpeaker = speaker || (isDialogue ? 'unknown' : undefined);
    const cfg = effectiveSpeaker ? SPEAKER_CONFIG[effectiveSpeaker] : undefined;
    if (cfg && !isCenter && !isEmphasis && !isShake) {
        return (
            <SpeechBubble
                text={text}
                cfg={cfg}
                fontSize={effectiveFontSize}
                bottom={bottom}
                opacity={opacity}
            />
        );
    }

    // 通常字幕
    const positionStyle: React.CSSProperties = isCenter
        ? { position: 'absolute', top: '50%', left: '10%', width: '80%' }
        : { position: 'absolute', bottom, left: 0, right: 0 };

    // shake → 黒帯スタイル（赤文字・白太枠）
    if (isShake) {
        return (
            <div style={{
                position: 'absolute',
                bottom,
                left: 0,
                right: 0,
                opacity,
                background: 'rgba(0,0,0,0.82)',
                padding: '22px 40px',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
            }}>
                <span style={{
                    fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
                    fontSize: effectiveFontSize * 1.15,
                    fontWeight: '900',
                    color: '#ff2020',
                    lineHeight: 1.45,
                    whiteSpace: 'pre-wrap',
                    textAlign: 'center',
                    letterSpacing: '0.06em',
                    textShadow: [
                        '-5px -5px 0 #fff', '5px -5px 0 #fff',
                        '-5px  5px 0 #fff', '5px  5px 0 #fff',
                        '-5px    0 0 #fff', '5px    0 0 #fff',
                        '0   -5px 0 #fff', '0    5px 0 #fff',
                    ].join(', '),
                    WebkitTextStroke: '2px #fff',
                }}>
                    {text.split(/<br\s*\/?>/i).map((line, i, arr) => (
                        <React.Fragment key={i}>
                            {line}
                            {i !== arr.length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </span>
            </div>
        );
    }

    return (
        <div
            style={{
                ...positionStyle,
                transform: finalTransform,
                opacity,
                display: 'flex',
                justifyContent: 'center',
                fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
                fontSize: effectiveFontSize,
                fontWeight: 'bold',
                color: effectiveColor,
                textShadow: baseTextShadow + glowShadow,
                lineHeight: 1.3,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                textAlign: 'center',
            }}
        >
            <span style={{ padding: '10px' }}>
                {text.split(/<br\s*\/?>/i).map((line, i, arr) => (
                    <React.Fragment key={i}>
                        {line}
                        {i !== arr.length - 1 && <br />}
                    </React.Fragment>
                ))}
            </span>
        </div>
    );
};
