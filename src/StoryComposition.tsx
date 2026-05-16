import React, { useMemo, useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, continueRender, delayRender } from 'remotion';
import { z } from 'zod';
import { KenBurns } from './KenBurns';
import { AutoSplitSubtitle } from './AutoSplitSubtitle';

// Shared Schema for all chapters
export const StorySchema = z.object({
    subtitleBottom: z.number().default(80),
    subtitleFontSize: z.number().default(70),
    subtitleColor: z.string().default('#ffffff'),
    // Global transform adjustments (optional)
    imgScale: z.number().default(1),
    imgX: z.number().default(0),
    imgY: z.number().default(0),
});

type ManifestItem = {
    id: string;
    chapter: number;
    file: string | null; // Audio file path relative to public/audio
    text: string;
    duration: number; // Seconds
};

const FPS = 30;

export const StoryComposition: React.FC<{
    chapterId: number;
    subtitleBottom: number;
    subtitleFontSize: number;
    subtitleColor: string;
    imgScale: number;
    imgX: number;
    imgY: number;
}> = ({
    chapterId,
    subtitleBottom,
    subtitleFontSize,
    subtitleColor,
    imgScale,
    imgX,
    imgY,
}) => {
        const [handle] = useState(() => delayRender("Loading Manifest"));
        const [manifest, setManifest] = useState<ManifestItem[] | null>(null);

        // Fetch manifest at runtime to ensure latest data is used
        useEffect(() => {
            fetch(staticFile('manifest.json'))
                .then(res => res.json())
                .then(data => {
                    setManifest(data);
                    continueRender(handle);
                })
                .catch(err => {
                    console.error("Failed to load manifest.json", err);
                    continueRender(handle);
                });
        }, [handle]);

        // 1. Filter manifest for this chapter using local state
        const chapterManifest = useMemo(() => {
            if (!manifest) return [];
            return manifest.filter(item => item.chapter === chapterId);
        }, [manifest, chapterId]);

        // 2. Build Timeline
        const timeline = useMemo(() => {
            if (!chapterManifest.length) return [];

            let currentFrame = 0;
            const items = [];

            for (const item of chapterManifest) {
                const durationFrames = Math.ceil(item.duration * FPS);
                items.push({
                    ...item,
                    start: currentFrame,
                    durationFrames,
                    end: currentFrame + durationFrames
                });
                currentFrame += durationFrames;
            }
            return items;
        }, [chapterManifest]);

        // Loading State
        if (!manifest) {
            return null;
        }

        if (chapterManifest.length === 0) {
            return <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: 50 }}>
                Chapter {chapterId} Not Found in Manifest
            </AbsoluteFill>;
        }

        return (
            <AbsoluteFill style={{ backgroundColor: 'black' }}>

                {/* --- VISUAL TRACK --- */}
                {timeline.map((item) => {
                    // Construct Image Path
                    // Format: assets/chapter{ch}/ch{ch}_sc{sc}.png
                    const imagePath = `assets/chapter${chapterId}/${item.id}.png`;

                    const fromScale = 1.0;
                    const toScale = 1.1;

                    return (
                        <Sequence key={`visual-${item.id}`} from={item.start} durationInFrames={item.durationFrames}>
                            <KenBurns
                                src={staticFile(imagePath)}
                                fromScale={fromScale}
                                toScale={toScale}
                                imgScale={imgScale} // Global adjustment
                                imgX={imgX}
                                imgY={imgY}
                                effectType="slowZoom"
                            />
                        </Sequence>
                    );
                })}

                {/* --- AUDIO & SUBTITLE TRACK --- */}
                {timeline.map((item) => {
                    return (
                        <Sequence key={`audio-${item.id}`} from={item.start} durationInFrames={item.durationFrames}>
                            {item.file && (
                                // Audio path in manifest is now full relative path "assets/audio/chapterX/..."
                                <Audio src={staticFile(item.file)} />
                            )}
                            {item.text && (
                                <AutoSplitSubtitle
                                    text={item.text}
                                    durationInFrames={item.durationFrames}
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
