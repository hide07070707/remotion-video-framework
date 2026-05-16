# Remotion Video Production Framework

Remotionを使った横型動画（1920×1080）制作フレームワークです。  
AI音声（ElevenLabs）+ AI画像でナレーション動画を自動生成します。

## 特徴

- **自動ナレーション**: ElevenLabs APIで高品質な日本語音声を生成
- **自動BGM**: ElevenLabs Music APIで雰囲気に合ったBGMを生成
- **効果音（SFX）**: テロップ出現時に効果音を自動再生
- **字幕テロップ**: シーンに合わせた吹き出し・強調テロップ
- **読み間違い修正**: ブラウザUIで音声の読み間違いをその場で修正・再生成
- **画像差し替え**: ブラウザUIで各シーンの画像を差し替え

## 必要なもの

- [Node.js](https://nodejs.org/) v18以上
- [ElevenLabs](https://elevenlabs.io/) アカウント（無料でも可）
- AIで生成した画像（各シーン用）

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/あなたのユーザー名/リポジトリ名.git
cd リポジトリ名
```

### 2. 依存パッケージをインストール

```bash
npm install
```

### 3. APIキーを設定

```bash
cp .env.example .env
```

`.env` を開いて ElevenLabs APIキーを入力してください。

### 4. 新しいストーリーを作成

```bash
node scripts/init-story.js
```

対話式でストーリー名を入力すると、必要なフォルダとファイルが自動生成されます。

## 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開くと Remotion Studio が起動します。

## 読み間違い・画像修正ツール

```bash
node scripts/corrections-server.js
```

ブラウザで `http://localhost:3001` を開くと修正UIが起動します。

## フォルダ構成

```
video/
├── src/                    # Remotionコンポーネント
│   ├── WashokuComposition.tsx  # メインの動画構成
│   ├── Subtitle.tsx            # 字幕コンポーネント
│   ├── Telop.tsx               # テロップコンポーネント
│   └── ...
├── scripts/                # 音声・画像生成スクリプト
│   ├── init-story.js           # 新ストーリー作成
│   ├── generate_audio_washoku.js   # ナレーション生成
│   ├── generate-bgm.js         # BGM生成
│   ├── corrections-server.js   # 修正UIサーバー
│   └── ...
├── public/
│   ├── assets/
│   │   ├── sfx/            # 効果音ファイル
│   │   ├── shared/         # 共有辞書テンプレート
│   │   └── your-story/     # ストーリー固有データ（gitignoreで非公開）
│   ├── fonts/              # フォントファイル
│   └── samples/            # 音声サンプル
└── .env.example            # APIキーのテンプレート
```

## ストーリーデータについて

台本・音声・画像はプライベートなコンテンツのため、`.gitignore` で除外されています。  
友人と仕組みだけを共有し、各自が自分の台本で動画を作る想定です。

## レンダリング（動画書き出し）

```bash
npm run build
```

`out/` フォルダに MP4 ファイルが出力されます。
