import { Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';

// Effect type definition
type EffectType = 'none' | 'slowZoom' | 'shake' | 'KenBurns' | 'BlurIn' | 'Flash' | 'Breathe' | 'panLeft' | 'panRight' | 'zoomOut';

export const KenBurns: React.FC<{
    src: string;
    style?: React.CSSProperties;
    fromScale?: number;
    toScale?: number;
    // Camera Controls
    imgScale?: number;
    imgX?: number;
    imgY?: number;
    effectType?: EffectType;
    filterStyle?: string;
}> = ({
    src,
    style,
    fromScale = 1.0,
    toScale = 1.1,
    imgScale = 1,
    imgX = 0,
    imgY = 0,
    effectType = 'none',
    filterStyle,
}) => {
        const frame = useCurrentFrame();
        const { durationInFrames } = useVideoConfig();

        // Base Ken Burns scale animation
        const kenBurnsScale = interpolate(
            frame,
            [0, durationInFrames],
            [fromScale, toScale],
            {
                extrapolateRight: 'clamp',
            }
        );

        // Effect-based animations
        let effectScale = 1;
        let effectX = 0;
        let effectY = 0;
        let blurAmount = 0;
        let opacity = 1;

        switch (effectType) {
            case 'slowZoom':
                // Slow zoom effect: gradually increase scale over time
                effectScale = interpolate(
                    frame,
                    [0, durationInFrames],
                    [1, 1.15],
                    { extrapolateRight: 'clamp' }
                );
                break;

            case 'shake':
                // Shake effect: small rapid oscillations
                const shakeIntensity = 3;
                const shakeFrequency = 0.5;
                effectX = Math.sin(frame * shakeFrequency) * shakeIntensity;
                effectY = Math.cos(frame * shakeFrequency * 1.3) * shakeIntensity;
                break;

            case 'KenBurns':
                // Ken Burns effect: elegant pan & zoom combination
                effectScale = interpolate(
                    frame,
                    [0, durationInFrames],
                    [1, 1.2],
                    { extrapolateRight: 'clamp' }
                );
                // Smooth diagonal pan
                effectX = interpolate(
                    frame,
                    [0, durationInFrames],
                    [0, 30],
                    { extrapolateRight: 'clamp' }
                );
                effectY = interpolate(
                    frame,
                    [0, durationInFrames],
                    [0, 15],
                    { extrapolateRight: 'clamp' }
                );
                break;

            case 'BlurIn':
                // Blur In effect: start blurred, become clear
                blurAmount = interpolate(
                    frame,
                    [0, durationInFrames * 0.5],
                    [10, 0],
                    { extrapolateRight: 'clamp' }
                );
                break;

            case 'Flash':
                // Flash effect: bright flash at the start
                const flashDuration = Math.min(15, durationInFrames * 0.1);
                opacity = interpolate(
                    frame,
                    [0, flashDuration],
                    [0.3, 1],
                    { extrapolateRight: 'clamp' }
                );
                break;

            case 'Breathe':
                // Breathe effect: gentle heartbeat-like pulsing
                const breatheFrequency = 0.05;
                const breatheIntensity = 0.03;
                effectScale = 1 + Math.sin(frame * breatheFrequency) * breatheIntensity;
                break;

            case 'panLeft':
                // 少しズームして右から左へパン
                effectScale = 1.12;
                effectX = interpolate(
                    frame,
                    [0, durationInFrames],
                    [50, -50],
                    { extrapolateRight: 'clamp' }
                );
                break;

            case 'panRight':
                // 少しズームして左から右へパン
                effectScale = 1.12;
                effectX = interpolate(
                    frame,
                    [0, durationInFrames],
                    [-50, 50],
                    { extrapolateRight: 'clamp' }
                );
                break;

            case 'zoomOut':
                // 大きめからゆっくり引く
                effectScale = interpolate(
                    frame,
                    [0, durationInFrames],
                    [1.18, 1.0],
                    { extrapolateRight: 'clamp' }
                );
                break;

            case 'none':
            default:
                // No effect
                break;
        }

        // Combine all transformations
        const finalScale = kenBurnsScale * imgScale * effectScale;
        const finalX = imgX + effectX;
        const finalY = imgY + effectY;

        return (
            <div style={{ overflow: 'hidden', width: '100%', height: '100%' }}>
                {/* @ts-expect-error: Remotion Img type mismatch with new React types */}
                <Img
                    src={src}
                    style={{
                        ...style,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `scale(${finalScale}) translate(${finalX}px, ${finalY}px)`,
                        filter: [blurAmount > 0 ? `blur(${blurAmount}px)` : null, filterStyle ?? null].filter(Boolean).join(' ') || undefined,
                        opacity: opacity,
                    }}
                />
            </div>
        );
    };
