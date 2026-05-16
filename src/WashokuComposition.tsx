import React, { useState, useEffect } from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, delayRender, continueRender, useCurrentFrame, interpolate } from 'remotion';
import { loadFont } from '@remotion/google-fonts/DelaGothicOne';
import { z } from 'zod';
import { KenBurns } from './KenBurns';
import { Subtitle } from './Subtitle';
import { Annotation } from './Annotation';
import { DoctorMemo } from './DoctorMemo';
import { ShowaEffect } from './ShowaEffect';
import { EmphasisTelop, QuestionBubbles, SupplementBox, ExampleCard, NumberTelop, VerticalTelop, StripeTelop, TelopData } from './Telop';

// -------------------------------------------------------
// 型定義
// -------------------------------------------------------
type ManifestItem = {
    id: string;
    scene_no: number;
    subtitle: string;
    audio: string;
    image: string;
    durationSec: number;
    durationInFrames: number;
    filter?: string;
    textStyle?: string;
    annotation?: string;
    annotationStyle?: string;
    chapterTitle?: string;
    doctorMemo?: string;
    speaker?: string;
    audioTs?: number;
    telop?: TelopData;
};

type SceneSlot = {
    id: string;
    subtitle: string;
    audio: string;
    relativeStart: number;
    durationFrames: number;
    textStyle?: string;
    annotation?: string;
    annotationStyle?: string;
    chapterTitle?: string;
    doctorMemo?: string;
    speaker?: string;
    audioTs?: number;
    telop?: TelopData;
};

type ImageGroup = {
    image: string;
    groupStart: number;
    totalFrames: number;
    effectType: string;
    filter?: string;
    chapterTitle?: string;
    doctorMemo?: string;
    scenes: SceneSlot[];
};

// -------------------------------------------------------
// 画像グループのフェードイン/アウトオーバーレイ
// -------------------------------------------------------
const GroupFade: React.FC<{ totalFrames: number; fadeFrames?: number; chapterFadeIn?: number }> = ({
    totalFrames,
    fadeFrames = 15,
    chapterFadeIn,
}) => {
    const frame = useCurrentFrame();
    const inFrames = chapterFadeIn ?? fadeFrames;
    const fadeIn  = interpolate(frame, [0, inFrames], [1, 0], { extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [totalFrames - fadeFrames, totalFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const opacity = Math.max(fadeIn, fadeOut);
    if (opacity === 0) return null;
    return <AbsoluteFill style={{ background: 'black', opacity, pointerEvents: 'none' }} />;
};

// -------------------------------------------------------
// ② 白フラッシュ（shakeシーン冒頭）
// -------------------------------------------------------
const SceneFlash: React.FC = () => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame, [0, 4, 10], [0, 0.88, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    if (opacity === 0) return null;
    return <AbsoluteFill style={{ background: 'white', opacity, pointerEvents: 'none' }} />;
};

// -------------------------------------------------------
// ③ ビネット（shakeシーン中：周辺を暗くして視線を中央へ）
// -------------------------------------------------------
const Vignette: React.FC = () => {
    const frame = useCurrentFrame();
    const strength = 0.68 + Math.sin(frame * 0.38) * 0.14;
    return (
        <AbsoluteFill style={{
            background: `radial-gradient(ellipse at center, transparent 36%, rgba(0,0,0,${strength.toFixed(2)}) 100%)`,
            pointerEvents: 'none',
        }} />
    );
};

// -------------------------------------------------------
// 章タイトルカード
// -------------------------------------------------------
const ChapterCard: React.FC<{ title: string }> = ({ title }) => {
    const frame = useCurrentFrame();
    const SERIF = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
    const GOLD  = '#c8a455';

    // 第N章 と タイトル を分割
    const match       = title.match(/^(第.章)\s*(.+)$/);
    const chapterNum  = match ? match[1] : '';
    const chapterName = match ? match[2] : title;

    // 暗幕: 0→8 フェードイン、58→70 フェードアウト
    const overlayOp = interpolate(frame, [0, 8, 58, 70], [0, 0.88, 0.88, 0],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

    // コンテンツ全体: 58→68 フェードアウト
    const contentOp = interpolate(frame, [8, 18, 58, 68], [0, 1, 1, 0],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

    // 章番号: 上からスライドイン
    const numY  = interpolate(frame, [8,  22], [-24, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

    // 装飾ライン幅: 0→1 に伸びる
    const lineW = interpolate(frame, [20, 38], [0, 160], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

    // タイトル: 下からスライドイン
    const titleY = interpolate(frame, [22, 36], [28, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            {/* 暗幕オーバーレイ */}
            <AbsoluteFill style={{ background: '#080808', opacity: overlayOp }} />

            {/* タイトルコンテンツ */}
            <AbsoluteFill style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                opacity: contentOp,
                gap: 0,
            }}>
                {/* 章番号 */}
                <div style={{
                    fontFamily: SERIF,
                    fontSize: 34,
                    fontWeight: 'normal',
                    color: GOLD,
                    letterSpacing: '0.5em',
                    transform: `translateY(${numY}px)`,
                    marginBottom: 24,
                }}>
                    {chapterNum}
                </div>

                {/* 上の装飾ライン */}
                <div style={{ width: lineW, height: 1, background: GOLD, opacity: 0.7, marginBottom: 32 }} />

                {/* チャプタータイトル */}
                <div style={{
                    fontFamily: SERIF,
                    fontSize: 76,
                    fontWeight: 'normal',
                    color: '#ffffff',
                    letterSpacing: '0.28em',
                    transform: `translateY(${titleY}px)`,
                    textShadow: '0 2px 40px rgba(0,0,0,0.6)',
                    whiteSpace: 'nowrap',
                }}>
                    {chapterName}
                </div>

                {/* 下の装飾ライン */}
                <div style={{ width: lineW, height: 1, background: GOLD, opacity: 0.7, marginTop: 32 }} />
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

// -------------------------------------------------------
// フィルター名 → CSS マップ
// -------------------------------------------------------
const SCENE_FILTERS: Record<string, string> = {
    sepia: 'sepia(0.85) brightness(0.88) contrast(1.08) saturate(0.75)',
    cool:  'brightness(0.92) saturate(0.75) hue-rotate(15deg)',
    warm:  'brightness(1.05) saturate(1.15) hue-rotate(-8deg)',
};

// -------------------------------------------------------
// エフェクト循環リスト
// -------------------------------------------------------
const EFFECT_CYCLE = [
    'slowZoom',
    'panLeft',
    'panRight',
    'KenBurns',
    'zoomOut',
    'panRight',
    'panLeft',
    'slowZoom',
] as const;

// -------------------------------------------------------
// manifest → ImageGroup[] に変換
// -------------------------------------------------------
function buildImageGroups(
    manifest: ManifestItem[],
    imageSwitchGap: number,
    subtitleGap: number,
): ImageGroup[] {
    const groups: ImageGroup[] = [];
    let globalFrame = 0;
    let groupIndex  = 0;
    let i = 0;

    while (i < manifest.length) {
        const i_start         = i;
        const currentImage    = manifest[i].image;
        const groupFilter     = manifest[i].filter;
        const groupChapter    = manifest[i].chapterTitle;
        const groupStart      = globalFrame;
        const extraDelay      = groupChapter ? CHAPTER_EXTRA_DELAY : 0;
        // 先頭は画像切替ギャップ（章タイトルありは追加遅延）
        let relativeFrame  = imageSwitchGap + extraDelay;
        const scenes: SceneSlot[] = [];
        let sceneIndexInGroup = 0;

        while (i < manifest.length && manifest[i].image === currentImage) {
            const d = manifest[i].durationInFrames || 90;

            // 2つ目以降のシーンの前にテロップ切替ギャップを挿入
            if (sceneIndexInGroup > 0) {
                relativeFrame += subtitleGap;
                globalFrame   += subtitleGap;
            }

            scenes.push({
                id:             manifest[i].id,
                subtitle:       manifest[i].subtitle,
                audio:          manifest[i].audio,
                relativeStart:  relativeFrame,
                durationFrames: d,
                textStyle:       manifest[i].textStyle,
                annotation:      manifest[i].annotation,
                annotationStyle: manifest[i].annotationStyle,
                doctorMemo:      manifest[i].doctorMemo,
                speaker:         manifest[i].speaker,
                audioTs:         manifest[i].audioTs,
                telop:           manifest[i].telop,
            });

            relativeFrame += d;
            globalFrame   += d;
            i++;
            sceneIndexInGroup++;
        }

        // グループの totalFrames = 先頭ギャップ + シーン合計 + テロップ間ギャップ合計
        // relativeFrame にはすでに全てが含まれている
        globalFrame += imageSwitchGap + extraDelay; // 先頭ギャップ分を globalFrame にも反映

        groups.push({
            image:       currentImage,
            groupStart,
            totalFrames: relativeFrame,
            effectType:  EFFECT_CYCLE[groupIndex % EFFECT_CYCLE.length],
            filter:       groupFilter,
            chapterTitle: groupChapter,
            doctorMemo:   manifest[i_start].doctorMemo,
            scenes,
        });
        groupIndex++;
    }

    return groups;
}

// -------------------------------------------------------
// calculateMetadata 用ユーティリティ（外部から参照）
// -------------------------------------------------------
export const CHAPTER_EXTRA_DELAY = 40; // 章タイトル表示のための追加フレーム数

export function countImageGroups(manifest: { image: string }[]): number {
    let count = 0;
    let lastImage = '';
    for (const item of manifest) {
        if (item.image !== lastImage) {
            count++;
            lastImage = item.image;
        }
    }
    return count;
}

export function countChapterGroups(manifest: { image: string; chapterTitle?: string }[]): number {
    let count = 0;
    let lastImage = '';
    for (const item of manifest) {
        if (item.image !== lastImage) {
            if (item.chapterTitle) count++;
            lastImage = item.image;
        }
    }
    return count;
}

// -------------------------------------------------------
// Props スキーマ
// -------------------------------------------------------
export const WashokuSchema = z.object({
    subtitleBottom:        z.number().default(80),
    subtitleFontSize:      z.number().default(62),
    subtitleColor:         z.string().default('#ffffff'),
    imageSwitchGapFrames:  z.number().default(20),  // 画像切替時の間（約0.67秒）
    subtitleGapFrames:     z.number().default(10),  // テロップ切替時の間（約0.33秒）
});

// -------------------------------------------------------
// コンポーネント本体
// -------------------------------------------------------
const { fontFamily: delaGothicFamily } = loadFont();

// 零ゴシックのフォントファミリー名（CSS で使う名前）
const REI_GOTHIC_FAMILY = '零ゴシック';
// public/fonts/ に置くファイル名（ダウンロード後リネームして配置）
const REI_GOTHIC_FILE = 'zero-gothic.ttf'; // OTFをTTFとしてコピー済み・問題なし

export const WashokuComposition: React.FC<z.infer<typeof WashokuSchema>> = ({
    subtitleBottom,
    subtitleFontSize,
    subtitleColor,
    imageSwitchGapFrames,
    subtitleGapFrames,
}) => {
    const [handle]     = useState(() => delayRender('washoku manifest 読み込み中'));
    const [fontHandle] = useState(() => delayRender('零ゴシック 読み込み中'));
    const [shakeFontFamily, setShakeFontFamily] = useState(delaGothicFamily);
    const [groups, setGroups] = useState<ImageGroup[]>([]);
    const frame = useCurrentFrame();
    const isStudio = process.env.NODE_ENV === 'development';

    // 零ゴシック読み込み
    useEffect(() => {
        const url = staticFile(`fonts/${REI_GOTHIC_FILE}`);
        const font = new FontFace(REI_GOTHIC_FAMILY, `url(${url})`);
        font.load()
            .then((loaded) => {
                document.fonts.add(loaded);
                setShakeFontFamily(REI_GOTHIC_FAMILY);
                continueRender(fontHandle);
            })
            .catch(() => {
                // ファイルが未配置の場合は Dela Gothic One で代替
                continueRender(fontHandle);
            });
    }, [fontHandle]);

    useEffect(() => {
        const url = staticFile('assets/washoku/manifest_final.json') + '?t=' + Date.now();
        fetch(url)
            .then((res) => res.json())
            .then((data: ManifestItem[]) => {
                setGroups(buildImageGroups(data, imageSwitchGapFrames, subtitleGapFrames));
                continueRender(handle);
            })
            .catch((err) => {
                console.error('washoku manifest 読み込みエラー:', err);
                continueRender(handle);
            });
    }, [handle, imageSwitchGapFrames, subtitleGapFrames]);

    // 開発時：修正サイトで再生成された音声を自動反映（4秒ポーリング）
    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return;
        let prevKey = '';
        const id = setInterval(async () => {
            try {
                const url = staticFile('assets/washoku/manifest_final.json') + '?t=' + Date.now();
                const data: ManifestItem[] = await (await fetch(url)).json();
                const key = data.map(d => `${d.id}:${d.audioTs ?? 0}`).join('|');
                if (prevKey && key !== prevKey) {
                    setGroups(buildImageGroups(data, imageSwitchGapFrames, subtitleGapFrames));
                }
                prevKey = key;
            } catch {}
        }, 4000);
        return () => clearInterval(id);
    }, [imageSwitchGapFrames, subtitleGapFrames]);

    // スタジオ再生中に現在のシーンを特定
    let studioScene: { id: string; subtitle: string } | null = null;
    if (isStudio) {
        outer: for (const group of groups) {
            const gf = frame - group.groupStart;
            if (gf >= 0 && gf < group.totalFrames) {
                for (const scene of group.scenes) {
                    if (gf >= scene.relativeStart && gf < scene.relativeStart + scene.durationFrames) {
                        studioScene = { id: scene.id, subtitle: scene.subtitle };
                        break outer;
                    }
                }
            }
        }
    }

    if (groups.length === 0) return null;

    // 章ごとの BGM 再生レンジを計算
    const bgmRanges: { chapter: number; from: number; durationInFrames: number }[] = [];
    {
        let currentChapter = 1;
        let chapterStart   = 0;
        groups.forEach((g, i) => {
            if (g.chapterTitle && i > 0) {
                bgmRanges.push({ chapter: currentChapter, from: chapterStart, durationInFrames: g.groupStart - chapterStart });
                currentChapter++;
                chapterStart = g.groupStart;
            }
        });
        const last = groups[groups.length - 1];
        bgmRanges.push({ chapter: currentChapter, from: chapterStart, durationInFrames: last.groupStart + last.totalFrames - chapterStart });
    }

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            {/* 章別 BGM（90秒ループ、音量 12%） */}
            {bgmRanges.map(({ chapter, from, durationInFrames }) => (
                <Sequence key={`bgm-ch${chapter}`} from={from} durationInFrames={durationInFrames}>
                    <Audio
                        src={staticFile(`assets/washoku/audio/bgm_ch${chapter}.mp3`)}
                        volume={0.12}
                        loop
                        {...({} as any)}
                    />
                </Sequence>
            ))}
            {groups.map((group, gi) => (
                <Sequence
                    key={`img-group-${gi}`}
                    from={group.groupStart}
                    durationInFrames={group.totalFrames}
                >
                    {/* 画像：グループ全体に1つのエフェクトを適用 */}
                    <KenBurns
                        src={staticFile(group.image)}
                        fromScale={1.0}
                        toScale={1.0}
                        imgScale={1.0}
                        imgX={0}
                        imgY={0}
                        effectType={group.effectType as any}
                        filterStyle={group.filter ? SCENE_FILTERS[group.filter] : undefined}
                    />

                    {/* セピア回想シーン：昭和フィルム風エフェクト */}
                    {group.filter === 'sepia' && (
                        <>
                            <AbsoluteFill style={{ background: 'rgba(140, 90, 20, 0.10)', pointerEvents: 'none' }} />
                            <AbsoluteFill style={{
                                background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.42) 100%)',
                                pointerEvents: 'none',
                            }} />
                            <AbsoluteFill><ShowaEffect /></AbsoluteFill>
                        </>
                    )}

                    {/* 字幕グラデーション */}
                    <AbsoluteFill
                        style={{
                            background:
                                'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0) 38%)',
                        }}
                    />

                    {/* 画像グループのフェードイン/アウト（章タイトルありは長め） */}
                    <GroupFade
                        totalFrames={group.totalFrames}
                        chapterFadeIn={group.chapterTitle ? 70 : undefined}
                    />
                    {/* 章タイトルカード ＋ 効果音 */}
                    {group.chapterTitle && <ChapterCard title={group.chapterTitle} />}
                    {group.chapterTitle && (
                        <Sequence from={6} durationInFrames={75}>
                            <Audio src={staticFile('assets/sfx/chapter.mp3')} volume={0.5} {...({} as any)} />
                        </Sequence>
                    )}

                    {/* シーンごとの音声＋字幕 */}
                    {group.scenes.map((scene) => (
                        <Sequence
                            key={scene.id}
                            from={scene.relativeStart}
                            durationInFrames={scene.durationFrames}
                        >
                            {scene.audio && (
                                <Audio
                                    src={staticFile(scene.audio) + (scene.audioTs ? `?t=${scene.audioTs}` : '')}
                                    {...({} as any)}
                                />
                            )}
                            {/* speaker あり → 吹き出し */}
                            {scene.speaker && scene.subtitle && (
                                <Subtitle
                                    text={scene.subtitle}
                                    bottom={subtitleBottom}
                                    fontSize={subtitleFontSize}
                                    color={subtitleColor}
                                    textStyle={scene.textStyle as any}
                                    shakeFontFamily={shakeFontFamily}
                                    speaker={scene.speaker}
                                />
                            )}
                            {/* textStyle あり → 字幕スタイル表示 */}
                            {!scene.speaker && !scene.telop && scene.subtitle && scene.textStyle && (
                                <Subtitle
                                    text={scene.subtitle}
                                    bottom={subtitleBottom}
                                    fontSize={subtitleFontSize}
                                    color={subtitleColor}
                                    textStyle={scene.textStyle as any}
                                    shakeFontFamily={shakeFontFamily}
                                />
                            )}
                            {scene.telop && (() => {
                                const delay = scene.telop.delay ?? 0;
                                const remain = scene.durationFrames - delay;
                                if (remain <= 0) return null;
                                return (
                                    <Sequence from={delay} durationInFrames={remain}>
                                        {scene.telop.type === 'emphasis'   && <EmphasisTelop text={scene.telop.text ?? ''} color={scene.telop.color} emphasisPosition={scene.telop.position} />}
                                        {scene.telop.type === 'question'   && <QuestionBubbles text={scene.telop.text ?? ''} />}
                                        {scene.telop.type === 'supplement' && <SupplementBox text={scene.telop.text ?? ''} position={scene.telop.position} />}
                                        {scene.telop.type === 'card'       && <ExampleCard text={scene.telop.text ?? ''} items={scene.telop.items} position={scene.telop.position} />}
                                        {scene.telop.type === 'number'     && <NumberTelop text={scene.telop.text ?? ''} unit={scene.telop.unit} />}
                                        {scene.telop.type === 'vertical'   && <VerticalTelop text={scene.telop.text ?? ''} color={scene.telop.color} position={scene.telop.position} />}
                                        {scene.telop.type === 'stripe'     && <StripeTelop text={scene.telop.text ?? ''} unit={scene.telop.unit} color={scene.telop.color} position={scene.telop.position} />}
                                        {/* テロップ効果音 */}
                                        {scene.telop.type === 'emphasis' && (
                                            <Sequence from={0} durationInFrames={45}>
                                                <Audio src={staticFile(scene.telop.color === 'red' ? 'assets/sfx/emphasis_red.mp3' : 'assets/sfx/emphasis_yellow.mp3')} volume={0.4} {...({} as any)} />
                                            </Sequence>
                                        )}
                                        {scene.telop.type === 'number' && (
                                            <Sequence from={0} durationInFrames={45}>
                                                <Audio src={staticFile('assets/sfx/number.mp3')} volume={0.35} {...({} as any)} />
                                            </Sequence>
                                        )}
                                        {scene.telop.type === 'stripe' && (
                                            <Sequence from={0} durationInFrames={30}>
                                                <Audio src={staticFile('assets/sfx/stripe.mp3')} volume={0.4} {...({} as any)} />
                                            </Sequence>
                                        )}
                                        {scene.telop.type === 'question' && (
                                            <Sequence from={0} durationInFrames={24}>
                                                <Audio src={staticFile('assets/sfx/question.mp3')} volume={0.35} {...({} as any)} />
                                            </Sequence>
                                        )}
                                        {scene.telop.type === 'vertical' && (
                                            <Sequence from={0} durationInFrames={21}>
                                                <Audio src={staticFile('assets/sfx/vertical.mp3')} volume={0.35} {...({} as any)} />
                                            </Sequence>
                                        )}
                                    </Sequence>
                                );
                            })()}
                            {scene.annotation && (
                                <Annotation
                                    text={scene.annotation}
                                    style={scene.annotationStyle as any}
                                />
                            )}
                            {/* ② 白フラッシュ・③ ビネット（shakeシーンのみ） */}
                            {scene.textStyle === 'shake' && <SceneFlash />}
                            {scene.textStyle === 'shake' && <Vignette />}
                        </Sequence>
                    ))}
                </Sequence>
            ))}

            {/* 医師のメモ：シーン開始〜次のメモ出現まで（最大600フレーム）グループをまたいで表示 */}
            {(() => {
                const memos: { start: number; text: string }[] = [];
                for (const group of groups) {
                    const memoScene = group.scenes.find(s => s.doctorMemo);
                    if (memoScene) {
                        memos.push({
                            start: group.groupStart + memoScene.relativeStart,
                            text:  memoScene.doctorMemo!,
                        });
                    }
                }
                return memos.map((memo, i) => {
                    const nextStart = i + 1 < memos.length ? memos[i + 1].start : memo.start + 600;
                    const duration  = Math.min(nextStart - memo.start, 600);
                    return (
                        <Sequence key={`doctor-memo-${i}`} from={memo.start} durationInFrames={duration}>
                            <DoctorMemo text={memo.text} />
                        </Sequence>
                    );
                });
            })()}

            {/* スタジオ専用：現在シーンのコピーボタン */}
            {isStudio && studioScene && (
                <AbsoluteFill style={{ pointerEvents: 'none' }}>
                    <div
                        style={{
                            position: 'absolute',
                            top: 14,
                            right: 14,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'rgba(0,0,0,0.72)',
                            color: 'white',
                            padding: '7px 14px',
                            borderRadius: 8,
                            fontSize: 13,
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            userSelect: 'none',
                            border: '1px solid rgba(255,255,255,0.15)',
                        }}
                        onClick={() => navigator.clipboard.writeText(studioScene!.subtitle)}
                    >
                        <span style={{ opacity: 0.55, fontSize: 11, fontFamily: 'monospace' }}>
                            {studioScene.id}
                        </span>
                        <span>📋 字幕をコピー</span>
                    </div>
                </AbsoluteFill>
            )}
        </AbsoluteFill>
    );
};
