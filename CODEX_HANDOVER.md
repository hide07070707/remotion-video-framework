# Codex 引き継ぎメモ

## このプロジェクトの目的

Remotionを使って、YouTube用の横型動画（1920×1080）をAIで自動生成するプロジェクトです。
ElevenLabs APIで日本語ナレーション音声・BGM・効果音を生成し、AI画像と組み合わせて動画を作ります。

これまで Claude Code（Antigravity）で開発・運用してきた内容を引き継いでいます。

---

## 現在のファイル構成

```
video/
├── src/                         # Remotionコンポーネント（動画の表示ロジック）
│   ├── WashokuComposition.tsx   # ★メインの動画コンポーネント（最重要）
│   ├── Subtitle.tsx             # 字幕・吹き出しコンポーネント
│   ├── Telop.tsx                # テロップ（強調・章タイトルなど）コンポーネント
│   ├── Root.tsx                 # Remotionのルート（コンポジション登録）
│   ├── KenBurns.tsx             # 画像のKenBurnsエフェクト
│   ├── Annotation.tsx           # アノテーション表示
│   └── index.ts                 # エントリーポイント
│
├── scripts/                     # 生成・管理スクリプト
│   ├── init-story.js            # ★新ストーリー作成（最初に実行するスクリプト）
│   ├── generate_audio_washoku.js # ナレーション音声生成（ElevenLabs）
│   ├── generate-bgm.js          # BGM生成（ElevenLabs Music API）
│   ├── generate-sfx.js          # 効果音生成（ElevenLabs）
│   ├── corrections-server.js    # 読み間違い・画像修正UI（ブラウザで操作）
│   ├── fix_readings.js          # 読み間違い一括修正
│   └── update_durations_washoku.js # 音声デュレーション更新
│
├── public/
│   ├── assets/
│   │   ├── washoku/             # 現在のストーリーデータ（.gitignoreで非公開）
│   │   │   ├── manifest_final.json  # ★シーン定義ファイル（最重要）
│   │   │   ├── audio/           # 生成済み音声ファイル
│   │   │   └── images/          # 使用画像ファイル
│   │   ├── sfx/                 # 効果音ファイル
│   │   └── shared/              # 共有辞書（corrections.json）
│   ├── fonts/                   # フォント（ライセンス品・非公開）
│   └── samples/                 # 声のサンプル音源
│
├── .env                         # APIキー（絶対に触らない・GitHubに上げない）
├── .env.example                 # APIキーのテンプレート
├── .gitignore                   # Git除外設定
├── package.json                 # npm設定
└── README.md                    # セットアップ手順

```

---

## 現在できていること

- **ナレーション音声生成**: ElevenLabs APIで日本語音声を自動生成
- **BGM生成**: ElevenLabs Music APIでシーンに合ったBGMを生成（チャプター別）
- **効果音（SFX）**: テロップ出現時に効果音を自動再生
- **字幕テロップ**: シーンに合わせた吹き出し・強調テロップ・章タイトルなど
- **読み間違い修正**: ブラウザUIで音声の読み間違いをその場で修正・再生成
- **画像差し替え**: ブラウザUIで各シーンの画像を差し替え
- **MP4出力**: `npm run render` でMP4ファイルとして書き出し

---

## 新しいストーリーを作る手順

1. `node scripts/init-story.js` を実行してストーリーフォルダを自動生成
2. `public/assets/[ストーリー名]/manifest_final.json` に台本・シーン情報を記述
3. `node scripts/generate_audio_washoku.js` でナレーション音声を生成
4. `node scripts/generate-bgm.js` でBGMを生成
5. `node scripts/generate-sfx.js` で効果音を生成
6. `npm start` でRemotionプレビューを確認（http://localhost:3000）
7. `node scripts/corrections-server.js` で修正UIを起動（http://localhost:3001）
8. `npm run render` でMP4を書き出し

---

## manifest_final.json の構造（最重要）

各シーンはこのJSON形式で定義されています：

```json
{
  "id": "sc_001",
  "chapter": 1,
  "durationFrames": 90,
  "narration": "ナレーションのテキスト",
  "image": "assets/[ストーリー名]/images/sc_001.jpg",
  "bgm": "assets/[ストーリー名]/audio/bgm_ch1.mp3",
  "sfx": "chapter",
  "telop": {
    "type": "emphasis",
    "text": "強調テロップ",
    "color": "red",
    "position": "center",
    "delay": 30
  },
  "speaker": "キャラクター名"
}
```

テロップの種類：`emphasis`（強調）、`chapter`（章タイトル）、`stripe`（帯）、`number`（数字）、`question`（疑問）、`vertical`（縦書き）

---

## Codexへの注意点

- **既存の動いている構成を壊さないこと**
- **変更前に、どのファイルを編集するか必ず説明すること**
- **大きく作り替える前に確認を取ること**
- **いきなり編集せず、まず「現在の構成の理解」から始めること**
- **最初は「まず確認だけしてください。まだ編集しないでください。」と伝えると安全**

---

## 絶対に触らないファイル

| ファイル | 理由 |
|---------|------|
| `.env` | APIキーが入っている。漏洩すると不正利用される |
| `node_modules/` | npmが管理するフォルダ。手動で編集しない |
| `public/assets/washoku/audio/` | 有料APIで生成した音声。再生成にコストがかかる |
| `public/fonts/` | ライセンス品のフォント |

---

## Codexへの最初の指示（コピーして使う）

```
このプロジェクトは、これまでClaude Codeで作業してきたRemotion動画生成プロジェクトです。

まず、CODEX_HANDOVER.md、README.md、package.json、srcフォルダの内容を確認してください。

そのうえで、現在の構成を壊さずに、次の台本用の動画を作成できるように作業を進めてください。

いきなり編集せず、最初に「現在の構成の理解」と「次に編集すべきファイル」を説明してください。
```
