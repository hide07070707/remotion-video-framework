import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

export const Annotation: React.FC<{
    text: string;
    style?: 'default' | 'total';
}> = ({ text, style = 'default' }) => {
    const frame = useCurrentFrame();
    const isTotal = style === 'total';

    const fontSize  = isTotal ? 100 : 80;
    const color     = '#dc2626';

    // タイプライター：1文字 3フレーム
    const charsToShow  = Math.min(Math.floor(frame / 3), text.length);
    const displayText  = text.slice(0, charsToShow);
    const textDoneFrame = text.length * 3;

    // 下線：文字が出終わった後に引かれる
    const lineProgress = interpolate(
        frame,
        [textDoneFrame, textDoneFrame + 18],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    const opacity = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: 'clamp' });

    const positionStyle: React.CSSProperties = isTotal
        ? { position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)' }
        : { position: 'absolute', top: '22%', right: '7%' };

    return (
        <div style={{ ...positionStyle, opacity, pointerEvents: 'none' }}>
            <div style={{
                fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
                fontSize,
                fontWeight: 'bold',
                color,
                textShadow: '2px 2px 5px rgba(0,0,0,0.55)',
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
            }}>
                {displayText}
            </div>
            {/* 赤い下線アニメーション */}
            <div style={{
                height: isTotal ? 6 : 4,
                width: `${lineProgress * 100}%`,
                background: color,
                borderRadius: 3,
                marginTop: 8,
                boxShadow: '1px 1px 3px rgba(0,0,0,0.4)',
            }} />
        </div>
    );
};
