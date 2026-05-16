import React from 'react';
import { useCurrentFrame } from 'remotion';

export const ShowaEffect: React.FC = () => {
    const frame = useCurrentFrame();
    const seed = frame % 200;

    // 不規則なちらつき
    const flicker = Math.sin(frame * 0.17) * Math.sin(frame * 0.43 + 1.2) * 0.05;

    return (
        <>
            {/* フィルムグレイン：フレームごとにseedを変えてアニメーション */}
            <svg
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    opacity: 0.32,
                    mixBlendMode: 'overlay',
                }}
            >
                <defs>
                    <filter id={`showa-grain-${seed}`}>
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.72"
                            numOctaves="4"
                            seed={seed}
                            stitchTiles="stitch"
                        />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                </defs>
                <rect width="100%" height="100%" filter={`url(#showa-grain-${seed})`} />
            </svg>

            {/* 走査線 */}
            <div style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                backgroundImage:
                    'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.10) 2px, rgba(0,0,0,0.10) 3px)',
            }} />

            {/* 不規則な明るさのちらつき */}
            <div style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `rgba(255,230,160,${Math.max(0, flicker)})`,
            }} />
        </>
    );
};
