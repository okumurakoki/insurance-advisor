# プロジェクト引き継ぎプロンプト - 変額保険アドバイザリーシステム

## プロジェクト概要
変額保険アドバイザリーシステム（Variable Insurance Advisory System）のフルスタックアプリケーション。企業名参照を削除し、v1.2.5にアップデートが完了した状態。

## プロジェクト構造
```
/Users/kohki_okumura/insurance-advisor/
├── frontend/          # React + TypeScript (Create React App)
│   ├── src/
│   │   ├── components/Layout.tsx    # v1.2.5表示（ヘッダー）
│   │   ├── App.tsx                  # v1.2.5表示（Chip）
│   │   └── pages/
│   ├── package.json                 # version: 1.2.5
│   └── vercel.json                  # buildsセクション削除済み
├── backend/           # Node.js + Express
└── supabase/          # Database migrations
```

## 技術スタック
- **Frontend**: React 18.2, TypeScript, Material-UI, React Router v6
- **Backend**: Node.js, Express, PostgreSQL
- **Database**: Supabase PostgreSQL
  - Database名: `postgres`
  - Project ID: `rozunxmzoaaksmehefuj`
  - Host: `db.rozunxmzoaaksmehefuj.supabase.co`
- **Hosting**:
  - Frontend: Vercel (Root Directory: `frontend`)
  - API: Vercel
  - CDN: Cloudflare
- **本番URL**: https://app.insurance-optimizer.com

## 最新の状態（2025-10-27 検証済み）

### 最近の変更（コミット履歴）
1. **13761d7** (最新): Fix version display in App.tsx to v1.2.5
2. **f20377b**: Remove builds section from vercel.json to fix deployment
3. **12a51d5**: Force Vercel deployment for v1.2.5
4. **8b390c8**: Remove company names from codebase and update to v1.2.5
5. **dcb47e8**: Fix version display by hardcoding v1.2.4

### 完了したタスク
✅ 全コードベースから企業名（プルデンシャル）を削除
✅ 著作権表記を「© 2025 変額保険アドバイザリーシステム」に更新
✅ バージョンを1.2.5に更新（Layout.tsx: 54行目、App.tsx: 275行目）
✅ package.jsonのバージョンを1.2.5に更新
✅ vercel.jsonの`builds`セクションを削除（Root Directory設定との競合を解消）
✅ Vercel自動デプロイが正常に動作
✅ 最新デプロイメント完了: https://prudential-insurance-optimizer-frontend-qpd6vpzmz.vercel.app

### デプロイ状況
- **Git**: ブランチ `main`、全変更がプッシュ済み
- **Vercel**: 自動デプロイ成功、本番環境にデプロイ済み
- **ステータス**: ● Ready
- **注意**: ユーザーがブラウザキャッシュをクリアするまで、v1.2.5が表示されない可能性あり

## 重要な設定ファイル

### frontend/package.json
```json
{
  "name": "insurance-advisor-frontend",
  "version": "1.2.5",
  "description": "Variable Insurance Advisory System Frontend"
}
```

### frontend/vercel.json
- `version` と `builds` セクションを削除済み
- `routes`セクションのみ（Cache-Control、セキュリティヘッダー設定）
- Vercelダッシュボードの「Root Directory: frontend」設定が有効

### frontend/src/components/Layout.tsx (54行目)
```tsx
<Typography variant="caption" component="div" sx={{ opacity: 0.8 }}>
  v1.2.5
</Typography>
```

### frontend/src/App.tsx (275行目)
```tsx
<Chip
  label="v1.2.5"
  size="small"
  ...
/>
```

## 既知の問題と解決済み事項

### 解決済み
1. ✅ vercel.jsonのbuildsセクション問題:
   - 問題: buildsセクションがダッシュボードのRoot Directory設定を上書き
   - 解決: buildsセクションを削除、ダッシュボード設定を使用

2. ✅ バージョン表示の不一致:
   - 問題: Layout.tsxとApp.tsxの両方にバージョン表示があり、片方しか更新していなかった
   - 解決: 両方を1.2.5に更新

3. ✅ Vercel自動デプロイ:
   - Git pushで自動的にデプロイが開始される
   - ビルド時間: 約53秒

### Cloudflareキャッシュについて
- 本番URLがCloudflareプロキシ経由
- 新デプロイ後、ユーザーはハードリフレッシュが必要（Cmd+Shift+R / Ctrl+Shift+R）
- または Cloudflareダッシュボードでキャッシュパージ

## 環境変数（backend/.env）
```
DATABASE_URL=postgresql://postgres:Kohki040108%40@db.rozunxmzoaaksmehefuj.supabase.co:5432/postgres
```

## Vercel CLIコマンド
```bash
# デプロイメント一覧
vercel list prudential-insurance-optimizer-frontend --scope kokiokumuras-projects

# デプロイメント詳細
vercel inspect <URL> --scope kokiokumuras-projects

# ログ確認
vercel inspect <URL> --logs --scope kokiokumuras-projects
```

## Git状態
- リモート: https://github.com/okumurakoki/insurance-advisor.git
- ブランチ: main
- 最新コミット: 13761d7
- 作業ディレクトリ: Clean（コミット待ちの変更なし）
  - 注: `frontend/vercel.json.backup` が削除済み（ステージング済み）

## 次のセッションで確認すべき事項
1. ユーザーがブラウザで v1.2.5 を確認できているか
2. 企業名が完全に削除されているか（UI上で確認）
3. フッターの著作権が「© 2025」になっているか

## よくある操作
```bash
# プロジェクトディレクトリに移動
cd /Users/kohki_okumura/insurance-advisor/frontend

# ローカルビルド
npm run build

# Gitステータス確認
git status

# 最新のデプロイメント確認
vercel list prudential-insurance-optimizer-frontend --scope kokiokumuras-projects | head -6
```

## 連絡事項
- ユーザーはVercel自動デプロイを希望
- ブラウザキャッシュ問題で v1.2.5 がまだ表示されていない可能性あり
- 次の作業: ユーザーからの確認待ち、または新機能開発

---

**このプロンプトを次のClaude Codeセッションの最初に貼り付ければ、現在の状態を完全に理解して作業を継続できます。**
