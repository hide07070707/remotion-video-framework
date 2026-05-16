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

## 友人向けセットアップ手順

### 必要なもの

- [Node.js](https://nodejs.org/) v16以上（v18推奨）
- [Git](https://git-scm.com/) （`git clone` に必要）
- [ElevenLabs](https://elevenlabs.io/) アカウント（無料でも可）
- [GitHub](https://github.com/) アカウント

### ① GitHubでフォーク

1. https://github.com/hide07070707/remotion-video-framework を開く
2. 右上の「**Fork**」ボタンをクリック
3. 自分のGitHubアカウントにコピーされる

### ② 自分のパソコンにダウンロード

```bash
git clone https://github.com/自分のユーザー名/remotion-video-framework.git
cd remotion-video-framework
```

### ③ パッケージをインストール

```bash
npm install
```

### ④ APIキーを設定

**Mac / Linux の場合：**
```bash
cp .env.example .env
```

**Windows コマンドプロンプトの場合：**
```bash
copy .env.example .env
```

**Windows PowerShell の場合：**
```powershell
Copy-Item .env.example .env
```

`.env` を開いて ElevenLabs の APIキーを入力してください。

```env
ELEVENLABS_API_KEY=ここに自分のAPIキーを入力
```

> ⚠️ APIキーは他人に見せたり、GitHubにアップしたりしないでください。

### ⑤ 起動確認

```bash
npm start
```

ブラウザで `http://localhost:3000` が開けば成功です。

### ⑥ 新しいストーリーを作成

```bash
node scripts/init-story.js
```

対話式でストーリー名を入力すると、必要なフォルダとファイルが自動生成されます。

## 開発サーバーの起動

```bash
npm start
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

## AIコーディングツールを使う場合

Claude Code（Antigravity）やCodexなどのAIコーディングツールを使う場合は、
手動でコマンドを入力しなくても、AIに依頼してセットアップできます。

ただし、以下は自分で準備してください。

- GitHubアカウントの作成
- リポジトリのFork、またはダウンロード
- Node.jsのインストール
- ElevenLabsアカウントの作成
- ElevenLabs APIキーの取得

AIには、たとえば以下のように依頼してください。

```
「このRemotionプロジェクトをセットアップしてください」
「npm install を実行してください」
「.env.example をコピーして .env を作ってください」
「Remotionを起動してください」
「READMEを読んで、起動に必要な作業を進めてください」
```

うまくいかない場合は、エラー画面やターミナルの表示をそのままAIに貼り付けて、
「このエラーの原因を調べて修正してください」と依頼してください。

> ⚠️ `.env` に入れるAPIキーは絶対にGitHubへアップしないでください。
> AIツールに作業させる場合も、プッシュ前に `.env` やAPIキーが含まれていないか確認してください。

## ストーリーデータについて

台本・音声・画像はプライベートなコンテンツのため、`.gitignore` で除外されています。  
友人と仕組みだけを共有し、各自が自分の台本で動画を作る想定です。

## レンダリング（動画書き出し）

```bash
npm run render
```

`out/` フォルダに MP4 ファイルが出力されます。
