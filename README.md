# 🎮 ito — ブラウザ版協力パーティーゲーム

協力型カードゲーム「Ito」のブラウザ実装です。最大10人がリアルタイムで遊べます。

## 🕹️ ゲームの遊び方

1. 各プレイヤーに **1〜99** のランダムな数字が割り当てられる
2. 共通の **テーマ**（例：「速いもの」）が発表される
3. **数字を言わずに**、テーマに沿ったヒントをチャットで伝える
4. 話し合いで全員を **昇順（小さい順）** に並べる
5. リーダーが **判定**！正しければ全員で勝利 🎉

---

## 🛠️ 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 18 + Vite |
| バックエンド | Node.js + Express |
| リアルタイム通信 | WebSocket (ws) |
| スタイリング | CSS Modules |

---

## 🚀 ローカルで動かす

### 必要なもの
- Node.js 18+

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/ito-game.git
cd ito-game

# 依存関係をインストール
npm run install:all

# ターミナルを2つ開いて...

# [ターミナル1] サーバー起動
npm run dev:server

# [ターミナル2] クライアント起動
npm run dev:client
```

ブラウザで http://localhost:5173 を開く。

---

## 🌐 本番デプロイ（Railway / Render / Fly.io など）

```bash
# クライアントをビルド
npm run build:client

# サーバーを起動（dist を静的ファイルとして配信）
npm start
```

サーバーは `PORT` 環境変数を参照します（デフォルト: 3001）。

### Render での手順

1. GitHub にプッシュ
2. Render で **Web Service** を新規作成
3. 設定:
   - **Build Command**: `npm run install:all && npm run build:client`
   - **Start Command**: `npm start`
4. デプロイ完了！

---

## 📁 プロジェクト構成

```
ito-game/
├── server/
│   ├── package.json
│   └── server.js          # Express + WebSocket サーバー
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx         # WebSocket 管理・画面ルーティング
│       ├── index.css       # グローバルスタイル
│       └── screens/
│           ├── TopScreen.jsx       # トップ（ルーム作成・参加）
│           ├── TopScreen.module.css
│           ├── WaitingScreen.jsx   # 待機ロビー
│           ├── WaitingScreen.module.css
│           ├── GameScreen.jsx      # ゲーム画面（チャット・並び替え）
│           ├── GameScreen.module.css
│           ├── ResultScreen.jsx    # 結果画面
│           └── ResultScreen.module.css
├── package.json            # ルートスクリプト
├── .gitignore
└── README.md
```

---

## 🔌 WebSocket イベント一覧

| クライアント → サーバー | 内容 |
|----------------------|------|
| `CREATE_ROOM` | ルーム作成 |
| `JOIN_ROOM` | ルーム参加 |
| `START_GAME` | ゲーム開始（リーダーのみ） |
| `CHAT` | チャット送信 |
| `UPDATE_ORDER` | 並び順変更 |
| `SUBMIT_ORDER` | 判定リクエスト（リーダーのみ） |
| `RESET` | ゲームリセット（リーダーのみ） |
| `LEAVE` | ルーム退出 |

| サーバー → クライアント | 内容 |
|----------------------|------|
| `ROOM_JOINED` | ルーム参加成功 |
| `ROOM_UPDATE` | ルーム状態更新 |
| `GAME_STARTED` | ゲーム開始通知 |
| `YOUR_NUMBER` | 自分の数字（個別送信） |
| `CHAT_MSG` | チャットメッセージ |
| `ORDER_UPDATED` | 並び順更新 |
| `GAME_RESULT` | 判定結果 |
| `GAME_RESET` | リセット完了 |
| `ERROR` | エラー通知 |

---

## ✨ 機能

- ✅ リアルタイム WebSocket 通信
- ✅ ルーム作成・参加（英数字ID）
- ✅ 最大10人まで対応
- ✅ 数字の個別配布（他プレイヤーには非公開）
- ✅ テーマランダム選択 / リーダーによる手動入力
- ✅ チャット（XSSサニタイズ済み）
- ✅ ドラッグ＆ドロップ + ボタンによる並び替え
- ✅ 全プレイヤーのリアルタイム順番同期
- ✅ 判定 → 全員の数字公開 → 正解順表示
- ✅ リーダー権限管理（離脱時に自動移譲）
- ✅ サーバー再接続対応

---

## 📄 ライセンス

MIT
