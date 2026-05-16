import React, { useMemo } from 'react';
import { Subtitle } from './Subtitle';

// Helper to insert newlines for multiline display
// Strategy: 
// 1. If text has '。' or '、' near the middle, split there.
// 2. Otherwise split by length.
const formatMultilineText = (text: string): string => {
    if (text.length <= 25) return text; // Short enough for 1 line

    const half = Math.floor(text.length / 2);
    // Search for punctuation near center (within 5 chars)
    const candidates = ['。', '、', '!', '！', '?', '？'];

    let bestSplitIndex = -1;
    let minDistance = 100;

    for (let i = 0; i < text.length; i++) {
        if (candidates.includes(text[i])) {
            const dist = Math.abs(i - half);
            if (dist < minDistance) {
                minDistance = dist;
                bestSplitIndex = i + 1; // Split after punctuation
            }
        }
    }

    // Keep split if it's reasonably balanced (e.g., inside middle 50%)
    if (bestSplitIndex !== -1 && minDistance < text.length * 0.25) {
        return text.slice(0, bestSplitIndex) + '\n' + text.slice(bestSplitIndex);
    }

    // Fallback: Split at punctuation anywhere if present? 
    // Or just simple length split?
    // Let's split at nearest punctuation to middle, or just middle space if English (not here), 
    // or just hard midpoint for Japanese.

    return text.slice(0, half) + '\n' + text.slice(half);
};

export const AutoSplitSubtitle: React.FC<{
    text: string;
    durationInFrames: number;
    bottom?: number;
    fontSize?: number;
    color?: string;
}> = ({ text, durationInFrames, bottom, fontSize, color }) => {

    const formattedText = useMemo(() => {
        return formatMultilineText(text);
    }, [text]);

    return <Subtitle text={formattedText} bottom={bottom} fontSize={fontSize} color={color} />;
};
