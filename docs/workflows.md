# GitHub Actions ワークフロー設定ドキュメント

このドキュメントでは、`.github/workflows/` ディレクトリに含まれる GitHub Actions ワークフローの設定について説明します。

---

## 1. Claude Code (`claude.yml`)

### 概要

Issue やプルリクエストのコメントで `@claude` とメンションすることで、Claude AI がタスクを実行するワークフローです。

### トリガー条件

以下のイベントが発生し、かつ `@claude` というメンションが含まれる場合に実行されます。

| イベント | タイプ | 説明 |
|---|---|---|
| `issue_comment` | `created` | Issue へのコメント投稿時 |
| `pull_request_review_comment` | `created` | PRのコードレビューコメント投稿時 |
| `issues` | `opened`, `assigned` | Issue の作成またはアサイン時 |
| `pull_request_review` | `submitted` | PRレビューの送信時 |

`@claude` メンションの検出対象:
- Issue のタイトル・本文
- コメントの本文
- PRレビューの本文

### パーミッション

| パーミッション | レベル | 用途 |
|---|---|---|
| `contents` | `read` | リポジトリのコードを読み取る |
| `pull-requests` | `read` | PRの情報を読み取る |
| `issues` | `read` | Issueの情報を読み取る |
| `id-token` | `write` | OIDC認証トークンの取得 |
| `actions` | `read` | CI実行結果の読み取り（PR上でのCI結果確認用） |

### ジョブステップ

1. **Checkout repository** - `actions/checkout@v4` でリポジトリをチェックアウト（`fetch-depth: 1` で最新コミットのみ取得）
2. **Run Claude Code** - `anthropics/claude-code-action@v1` を使用して Claude を実行

### 設定項目

| 設定 | 値 | 説明 |
|---|---|---|
| `claude_code_oauth_token` | `${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}` | Claude Code の認証トークン（Secrets に設定が必要） |
| `additional_permissions` | `actions: read` | CI結果読み取りのための追加パーミッション |

### カスタマイズ可能なオプション（コメントアウト済み）

- **`prompt`**: Claude に実行させる指示をカスタマイズできます（指定しない場合、`@claude` メンションを含むコメントの内容が指示として使われます）
- **`claude_args`**: Claude の動作をカスタマイズするための追加引数（例: `--allowed-tools Bash(gh pr:*)` で使用可能なツールを制限）

### 必要なシークレット

| シークレット名 | 説明 |
|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code の OAuth トークン |

---

## 2. Claude Code Review (`claude-code-review.yml`)

### 概要

プルリクエストが作成・更新された際に、Claude AI が自動でコードレビューを実行するワークフローです。

### トリガー条件

以下の PR イベントで自動実行されます：

| イベント | 説明 |
|---|---|
| `opened` | PRが新規作成された時 |
| `synchronize` | PRに新しいコミットがプッシュされた時 |
| `ready_for_review` | ドラフトPRがレビュー可能状態になった時 |
| `reopened` | クローズされたPRが再オープンされた時 |

### パーミッション

| パーミッション | レベル | 用途 |
|---|---|---|
| `contents` | `read` | リポジトリのコードを読み取る |
| `pull-requests` | `read` | PRの情報を読み取る |
| `issues` | `read` | Issueの情報を読み取る |
| `id-token` | `write` | OIDC認証トークンの取得 |

### ジョブステップ

1. **Checkout repository** - `actions/checkout@v4` でリポジトリをチェックアウト（`fetch-depth: 1` で最新コミットのみ取得）
2. **Run Claude Code Review** - `anthropics/claude-code-action@v1` を使用してコードレビューを実行

### 設定項目

| 設定 | 値 | 説明 |
|---|---|---|
| `claude_code_oauth_token` | `${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}` | Claude Code の認証トークン |
| `plugin_marketplaces` | `https://github.com/anthropics/claude-code.git` | プラグインの取得元リポジトリ |
| `plugins` | `code-review@claude-code-plugins` | 使用するプラグイン（コードレビュー用） |
| `prompt` | `/code-review:code-review {repo}/pull/{pr_number}` | コードレビューを実行するためのプロンプト |

### カスタマイズ可能なオプション（コメントアウト済み）

- **特定ファイルのみ対象**: `paths` を設定することで、特定のファイル変更時のみワークフローを実行できます（例: `src/**/*.ts` など）
- **特定ユーザーのPRのみ対象**: `if` 条件を設定することで、外部コントリビューターや初回コントリビューターのPRのみレビューを実行できます

### 必要なシークレット

| シークレット名 | 説明 |
|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code の OAuth トークン |

---

## セットアップ手順

両ワークフローを使用するには、以下のシークレットをリポジトリに設定してください。

1. GitHub リポジトリの **Settings** → **Secrets and variables** → **Actions** に移動
2. **New repository secret** をクリック
3. 以下のシークレットを追加:

| 名前 | 値 |
|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code の OAuth トークン（[Claude Code](https://claude.ai/code) で取得） |

## 参考リンク

- [claude-code-action 使用方法](https://github.com/anthropics/claude-code-action/blob/main/docs/usage.md)
- [Claude Code CLI リファレンス](https://code.claude.ai/docs/en/cli-reference)
- [FAQ](https://github.com/anthropics/claude-code-action/blob/main/docs/faq.md)
