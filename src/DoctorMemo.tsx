import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

const LINE_INTERVAL = 90;
const FIRST_LINE_DELAY = 60;
const SLIDE_FRAMES = 18;
const COUNT_FRAMES = 28; // 数字がカウントアップする時間

// 数字を含むテキストをパースしてカウントアップアニメーション付きで返す
const AnimatedLine: React.FC<{ text: string; elapsed: number }> = ({ text, elapsed }) => {
    const progress = Math.min(1, elapsed / COUNT_FRAMES);
    // 整数・小数を両方マッチ
    const parts = text.split(/([\d]+\.?[\d]*)/g);

    return (
        <>
            {parts.map((part, i) => {
                if (/^[\d]+\.?[\d]*$/.test(part) && part.length > 0) {
                    const target = parseFloat(part);
                    const current = target * progress;
                    const decimals = part.includes('.') ? (part.split('.')[1]?.length ?? 1) : 0;
                    const display = decimals > 0
                        ? current.toFixed(decimals)
                        : String(Math.round(current));
                    return (
                        <span key={i} style={{ color: '#fde68a' }}>{display}</span>
                    );
                }
                return <React.Fragment key={i}>{part}</React.Fragment>;
            })}
        </>
    );
};

export const DoctorMemo: React.FC<{ text: string }> = ({ text }) => {
    const frame = useCurrentFrame();
    const lines = text.split('\n');

    // パネルが上からスライドイン
    const slideY = interpolate(
        frame,
        [FIRST_LINE_DELAY - SLIDE_FRAMES, FIRST_LINE_DELAY],
        [-80, 0],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
    );
    const panelOpacity = interpolate(
        frame,
        [FIRST_LINE_DELAY - SLIDE_FRAMES, FIRST_LINE_DELAY],
        [0, 1],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
    );

    return (
        <div style={{
            position: 'absolute',
            top: 40,
            left: 0,
            right: 0,
            transform: `translateY(${slideY}px)`,
            opacity: panelOpacity,
            pointerEvents: 'none',
        }}>
            <div style={{
                display: 'inline-block',
                marginLeft: 60,
                background: 'rgba(8, 28, 72, 0.88)',
                borderLeft: '7px solid #f59e0b',
                padding: '16px 44px 16px 28px',
                backdropFilter: 'blur(2px)',
            }}>
                {/* ラベル */}
                <div style={{
                    color: '#f59e0b',
                    fontSize: 28,
                    fontWeight: 'bold',
                    fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
                    letterSpacing: '0.12em',
                    marginBottom: 8,
                }}>
                    ポイント
                </div>

                {/* 各行：順番にフェードイン＋数字カウントアップ */}
                {lines.map((line, i) => {
                    const lineStart = FIRST_LINE_DELAY + i * LINE_INTERVAL;
                    const lineOpacity = interpolate(
                        frame,
                        [lineStart, lineStart + 12],
                        [0, 1],
                        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
                    );
                    const elapsed = Math.max(0, frame - lineStart);
                    const hasNumber = /[\d]/.test(line);

                    return (
                        <div key={i} style={{
                            opacity: lineOpacity,
                            color: '#ffffff',
                            fontSize: 44,
                            fontWeight: 'bold',
                            fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
                            lineHeight: 1.55,
                            letterSpacing: '0.03em',
                        }}>
                            {'・'}
                            {hasNumber
                                ? <AnimatedLine text={line} elapsed={elapsed} />
                                : line
                            }
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
