# タロットコーチング 継続サービス デモ

## デプロイ手順

### 1. GitHubリポジトリを作成
```bash
cd tarot-coaching
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/tarot-coaching.git
git push -u origin main
```

### 2. Vercelにデプロイ
1. [vercel.com](https://vercel.com) にログイン
2. 「Import Project」からGitHubリポジトリを選択
3. 環境変数を設定:
   - `ANTHROPIC_API_KEY` = あなたのAnthropicのAPIキー

### 3. 環境変数の設定
Vercelのダッシュボード → Settings → Environment Variables に以下を追加:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (AnthropicのAPIキー) |

### 4. 動作確認
デプロイ完了後、URLにアクセスして以下を確認:
1. 占い師側タブ → プロフィール設定 → 顧客追加
2. 「体験→」でお客さん側タブに遷移
3. 「カードを引く」→ Claude APIでメッセージ生成
4. 月曜→木曜→日曜の順にボタンで開示

## 技術構成
- **フレームワーク**: Next.js 14 (App Router)
- **メッセージ生成**: Claude API (claude-sonnet-4-20250514) via Route Handler
- **フォールバック**: API失敗時はローカルテンプレートで即時生成
- **デプロイ**: Vercel

## ファイル構成
```
tarot-coaching/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.js    ← Claude API呼び出し (サーバーサイド)
│   ├── globals.css
│   ├── layout.js
│   └── page.js             ← メインUI (クライアントコンポーネント)
├── next.config.js
├── package.json
└── README.md
```
