import React from 'react';
import { useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

export type TelopType = 'emphasis' | 'question' | 'supplement' | 'card' | 'number' | 'vertical' | 'stripe';

export interface TelopData {
  type: TelopType;
  text?: string;
  items?: string[];
  unit?: string;      // number 用単位 / stripe 用左ラベル
  position?: 'left' | 'right' | 'bottom' | 'top' | 'center';
  color?: 'white' | 'yellow' | 'red' | 'cyan';
  delay?: number;     // シーン先頭からテロップ表示までの遅延フレーム数
}

const FONT = '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
const FADE = 10;

function useFade(durationInFrames: number) {
  const frame = useCurrentFrame();
  const fadeIn  = interpolate(frame, [0, FADE], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [durationInFrames - FADE, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return fadeIn * fadeOut;
}

const EMPHASIS_COLORS: Record<string, string> = {
  white:  '#ffffff',
  yellow: '#fbbf24',
  red:    '#ff3030',
  cyan:   '#22d3ee',
};

// ────────────────────────────────────────────
// 1. 強調テロップ（色・位置バリエーション付き）
// ────────────────────────────────────────────
export const EmphasisTelop: React.FC<{
  text: string;
  color?: string;
  emphasisPosition?: string;
}> = ({ text, color = 'white', emphasisPosition = 'bottom' }) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const opacity = useFade(durationInFrames);
  const scale   = interpolate(frame, [0, FADE], [0.88, 1], { extrapolateRight: 'clamp' });
  const slideX  = interpolate(frame, [0, FADE], [-120, 0], { extrapolateRight: 'clamp' });

  const textColor = EMPHASIS_COLORS[color] ?? '#ffffff';

  const outerStyle: React.CSSProperties = {
    position: 'absolute',
    left: '5%',
    width: '90%',
    display: 'flex',
    justifyContent: 'center',
    opacity,
    pointerEvents: 'none',
    ...(emphasisPosition === 'top'
      ? { top: 80,    transform: `translateX(${slideX}px) scale(${scale})` }
      : emphasisPosition === 'center'
      ? { top: '50%', transform: `translateX(${slideX}px) scale(${scale}) translateY(-50%)` }
      : { bottom: 100, transform: `translateX(${slideX}px) scale(${scale})` }),
  };

  return (
    <div style={outerStyle}>
      <span style={{
        fontFamily: FONT,
        fontSize: 88,
        fontWeight: 900,
        color: textColor,
        textAlign: 'center',
        letterSpacing: '0.04em',
        lineHeight: 1.25,
        textShadow: [
          '-4px -4px 0 #000', '4px -4px 0 #000',
          '-4px  4px 0 #000', '4px  4px 0 #000',
          '0 6px 18px rgba(0,0,0,0.7)',
        ].join(', '),
        whiteSpace: 'pre-wrap',
      }}>
        {text}
      </span>
    </div>
  );
};

// ────────────────────────────────────────────
// 2. 疑問吹き出し
// ────────────────────────────────────────────
export const QuestionBubbles: React.FC<{ text: string }> = ({ text }) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const questions = text.split('\n').filter(Boolean);

  const positions: { side: 'left' | 'right'; top: string }[] = [
    { side: 'left',  top: '22%' },
    { side: 'right', top: '38%' },
    { side: 'left',  top: '55%' },
    { side: 'right', top: '68%' },
  ];

  return (
    <>
      {questions.map((q, i) => {
        const pos = positions[i % positions.length];
        const startFrame = i * 8;
        const opacity = interpolate(frame, [startFrame, startFrame + FADE], [0, 1], { extrapolateRight: 'clamp' })
          * interpolate(frame, [durationInFrames - FADE, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const slideX = interpolate(frame, [startFrame, startFrame + FADE], [pos.side === 'left' ? -30 : 30, 0], { extrapolateRight: 'clamp' });

        return (
          <div key={i} style={{
            position: 'absolute',
            top: pos.top,
            [pos.side]: '2%',
            opacity,
            transform: `translateX(${slideX}px)`,
            pointerEvents: 'none',
            maxWidth: '28%',
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.93)',
              border: '3px solid #e53e3e',
              borderRadius: 14,
              padding: '10px 16px',
              fontFamily: FONT,
              fontSize: 34,
              fontWeight: 'bold',
              color: '#c53030',
              lineHeight: 1.4,
              boxShadow: '2px 4px 12px rgba(0,0,0,0.25)',
            }}>
              {q}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ────────────────────────────────────────────
// 3. 補足ボックス
// ────────────────────────────────────────────
export const SupplementBox: React.FC<{ text: string; position?: string }> = ({ text, position = 'left' }) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const opacity = useFade(durationInFrames);
  const slideY = interpolate(frame, [0, FADE], [-20, 0], { extrapolateRight: 'clamp' });

  const posStyle: React.CSSProperties = position === 'bottom'
    ? { bottom: 160, left: '5%', right: '5%' }
    : position === 'right'
    ? { top: 40, right: 40 }
    : { top: 40, left: 40 };

  return (
    <div style={{
      position: 'absolute',
      ...posStyle,
      opacity,
      transform: `translateY(${slideY}px)`,
      pointerEvents: 'none',
      maxWidth: 520,
    }}>
      <div style={{
        background: 'rgba(8, 28, 72, 0.88)',
        borderLeft: '6px solid #f59e0b',
        padding: '14px 28px 14px 20px',
        backdropFilter: 'blur(2px)',
      }}>
        <div style={{
          color: '#f59e0b',
          fontSize: 22,
          fontWeight: 'bold',
          fontFamily: FONT,
          letterSpacing: '0.1em',
          marginBottom: 6,
        }}>補足</div>
        {text.split('\n').map((line, i) => (
          <div key={i} style={{
            color: '#ffffff',
            fontSize: 36,
            fontWeight: 'bold',
            fontFamily: FONT,
            lineHeight: 1.5,
          }}>{line}</div>
        ))}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────
// 4. 実例カード
// ────────────────────────────────────────────
export const ExampleCard: React.FC<{ text: string; items?: string[]; position?: string }> = ({ text, items, position = 'right' }) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const opacity = useFade(durationInFrames);
  const slideX = interpolate(frame, [0, FADE], [position === 'right' ? 40 : -40, 0], { extrapolateRight: 'clamp' });

  const lines = items ?? text.split('\n').filter(Boolean);
  const posStyle: React.CSSProperties = position === 'right'
    ? { right: 40, top: '20%' }
    : { left: 40, top: '20%' };

  return (
    <div style={{
      position: 'absolute',
      ...posStyle,
      opacity,
      transform: `translateX(${slideX}px)`,
      pointerEvents: 'none',
      maxWidth: 380,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.96)',
        borderRadius: 16,
        padding: '20px 28px',
        boxShadow: '4px 8px 24px rgba(0,0,0,0.35)',
        borderTop: '6px solid #2563eb',
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            marginBottom: i < lines.length - 1 ? 10 : 0,
            fontFamily: FONT,
            fontSize: 36,
            fontWeight: 'bold',
            color: '#1a202c',
            lineHeight: 1.4,
          }}>
            <span style={{ color: '#2563eb', flexShrink: 0 }}>▶</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────
// 5. 数字テロップ
// ────────────────────────────────────────────
export const NumberTelop: React.FC<{ text: string; unit?: string }> = ({ text, unit }) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const opacity = useFade(durationInFrames);

  const COUNT_FRAMES = 30;
  const progress = Math.min(1, frame / COUNT_FRAMES);
  const numMatch = text.match(/[\d.]+/);
  const target = numMatch ? parseFloat(numMatch[0]) : 0;
  const current = target * progress;
  const decimals = text.includes('.') ? (text.split('.')[1]?.length ?? 1) : 0;
  const displayNum = decimals > 0 ? current.toFixed(decimals) : String(Math.round(current));
  const displayText = numMatch ? text.replace(numMatch[0], displayNum) : text;

  return (
    <div style={{
      position: 'absolute',
      bottom: 140,
      left: 0,
      right: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      opacity,
      pointerEvents: 'none',
    }}>
      <div style={{
        fontFamily: '"Arial Black", "Hiragino Kaku Gothic ProN", sans-serif',
        fontSize: 160,
        fontWeight: 900,
        color: '#fbbf24',
        lineHeight: 1,
        textShadow: '-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 0 8px 24px rgba(0,0,0,0.6)',
        letterSpacing: '-0.02em',
      }}>
        {displayText}
      </div>
      {unit && (
        <div style={{
          fontFamily: FONT,
          fontSize: 52,
          fontWeight: 'bold',
          color: '#ffffff',
          textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
          marginTop: -10,
          letterSpacing: '0.1em',
        }}>
          {unit}
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────
// 6. 縦文字テロップ（画面左右に大きく縦組み）
// ────────────────────────────────────────────
export const VerticalTelop: React.FC<{
  text: string;
  color?: string;
  position?: string;
}> = ({ text, color = 'yellow', position = 'left' }) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const opacity = useFade(durationInFrames);
  const slideY = interpolate(frame, [0, FADE], [-40, 0], { extrapolateRight: 'clamp' });

  const textColor = EMPHASIS_COLORS[color] ?? '#fbbf24';

  const posStyle: React.CSSProperties = position === 'center'
    ? { left: '50%', transform: `translateX(-50%) translateY(${slideY}px)` }
    : position === 'right'
    ? { right: 32, transform: `translateY(${slideY}px)` }
    : { left: 32, transform: `translateY(${slideY}px)` };

  return (
    <div style={{
      position: 'absolute',
      top: '12%',
      opacity,
      pointerEvents: 'none',
      maxHeight: '76%',
      ...posStyle,
    }}>
      <div style={{
        writingMode: 'vertical-rl',
        fontFamily: FONT,
        fontSize: 84,
        fontWeight: 900,
        color: textColor,
        letterSpacing: '0.08em',
        lineHeight: 1.15,
        textShadow: [
          '-3px -3px 0 #000', '3px -3px 0 #000',
          '-3px  3px 0 #000', '3px  3px 0 #000',
          '0 4px 20px rgba(0,0,0,0.75)',
        ].join(', '),
      }}>
        {text}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────
// 7. 帯テロップ（ニュース速報・TV情報番組風）
// ────────────────────────────────────────────
const STRIPE_SCHEMES: Record<string, { bg: string; accent: string }> = {
  red:  { bg: 'rgba(185, 28, 28, 0.93)', accent: '#fbbf24' },
  dark: { bg: 'rgba(12, 12, 12, 0.91)',  accent: '#fbbf24' },
  blue: { bg: 'rgba(30, 58, 138, 0.93)', accent: '#60a5fa' },
};

export const StripeTelop: React.FC<{
  text: string;
  unit?: string;
  color?: string;
  position?: string;
}> = ({ text, unit, color = 'dark', position = 'bottom' }) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const opacity = useFade(durationInFrames);
  const slideX = interpolate(frame, [0, FADE], [-120, 0], { extrapolateRight: 'clamp' });

  const scheme = STRIPE_SCHEMES[color] ?? STRIPE_SCHEMES.dark;
  const posStyle: React.CSSProperties = position === 'top'
    ? { top: 72 }
    : { bottom: 110 };

  return (
    <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      ...posStyle,
      opacity,
      transform: `translateX(${slideX}px)`,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        background: scheme.bg,
        backdropFilter: 'blur(4px)',
        minHeight: 96,
        paddingRight: 48,
      }}>
        {/* 左アクセントバー */}
        <div style={{
          width: 10,
          background: scheme.accent,
          flexShrink: 0,
        }} />
        {/* ラベル（unit フィールドを左バッジとして使用） */}
        {unit && (
          <div style={{
            background: scheme.accent,
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: FONT,
              fontSize: 32,
              fontWeight: 900,
              color: '#111111',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}>
              {unit}
            </span>
          </div>
        )}
        {/* メインテキスト */}
        <div style={{
          fontFamily: FONT,
          fontSize: 54,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '0.04em',
          lineHeight: 1.3,
          padding: '14px 0 14px 20px',
          alignSelf: 'center',
        }}>
          {text}
        </div>
      </div>
    </div>
  );
};
