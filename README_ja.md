<p align="center">
  <img src="docs/logo.svg" alt="Mimo Code" width="640"/>
</p>

<p align="center">
  <a href="./README.md">English</a>
  &nbsp;·&nbsp;
  <a href="./README_zh-CN.md">简体中文</a>
  &nbsp;·&nbsp;
  <strong>日本語</strong>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&color=3b82f6&labelColor=161b22" alt="License: MIT"/></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-≥18-green.svg?style=flat-square&color=3fb950&labelColor=161b22&logo=nodedotjs&logoColor=white" alt="Node.js"/></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.5-blue.svg?style=flat-square&color=3178c6&labelColor=161b22&logo=typescript&logoColor=white" alt="TypeScript"/></a>
  <a href="https://github.com/raaaaap/mimo-code/stargazers"><img src="https://img.shields.io/github/stars/raaaaap/mimo-code.svg?style=flat-square&color=dbab09&labelColor=161b22&logo=github&logoColor=white" alt="GitHub stars"/></a>
</p>

<br/>

<h3 align="center">MiMo 大規模言語モデルによる CLI コーディングアシスタント</h3>
<p align="center">TypeScript と Ink で構築 — ターミナル常駐の AI ペアプログラマー。</p>

<br/>

<p align="center">
  <img src="docs/assets/hero-terminal.svg" alt="Mimo Code — 対話型 REPL、小米猫マスコット、ツール実行、コード生成" width="860"/>
</p>

<br/>

## 概要

Mimo Code は、MiMo 大規模言語モデルの力を開発ワークフローにもたらすターミナルベースの AI コーディングアシスタントです。TypeScript と [Ink](https://github.com/vadimdemedes/ink)（React ターミナルフレームワーク）で構築されており、自然言語での会話を通じてコードの作成、コマンドの実行、ファイルの検索、タスクの管理が可能な対話型 REPL を提供します。


## ✨ 機能

### 🛠️ 13 の組み込みツール

| ツール | 説明 | 並行実行 |
|--------|------|:--------:|
| **Bash** | タイムアウト保護付きでシェルコマンドを実行 | ✅ |
| **PowerShell** | Windows ネイティブ PowerShell 実行、危険コマンドブロック付き | ✅ |
| **FileRead** | 行番号、オフセット、制限付きでファイルを読み取り | ✅ |
| **FileWrite** | ディレクトリ自動作成でファイルを作成または上書き | — |
| **FileEdit** | 一意性強制による精密な文字列置換 | — |
| **Glob** | パターンでファイルを検索（最大 200 件） | ✅ |
| **Grep** | ripgrep を使用してファイル内容を検索 | ✅ |
| **WebFetch** | URL からコンテンツを取得・抽出 | ✅ |
| **WebSearch** | DuckDuckGo 経由でウェブを検索 | ✅ |
| **TodoWrite** | 構造化出力でタスクリストを管理 | ✅ |
| **NotebookEdit** | Jupyter Notebook セルを編集（挿入/削除/置換） | — |
| **AskUserQuestion** | 対話式の多肢選択または自由回答プロンプト | — |
| **Agent** | 全ツールアクセス権を持つ自律サブエージェントを生成 | — |

### 🔌 複数プロバイダー API サポート

- **MiMo** — 1M コンテキストウィンドウと自動圧縮をネイティブサポート。モデル：`mimo-v2.5-pro`（1T パラメータ、$1-2/M 入力）、`mimo-v2.5`（$0.40-0.80/M 入力）
- **OpenAI** — ストリーミング SSE 対応の完全な OpenAI 互換 API
- **Anthropic** — Claude API の直接統合

### 🎨 その他の機能

- **リッチターミナル UI** — React ベースの REPL、シンタックスハイライト、差分表示、プログレスインジケーター付き
- **Markdown レンダリング** — ターミナルでヘッダー、太字、テーブル、インラインコードを表示
- **多言語UI** — `/language` コマンドで 简体中文、English、日本語 を切り替え
- **MiMo ネコマスコット** — エージェントの状態に反応するアニメーション ASCII アート（アイドル → 思考中 → コーディング → 成功/エラー）
- **パーミッションシステム** — 5 つのモード：`default`、`acceptEdits`、`bypassPermissions`、`plan`、`auto`
- **プラグインシステム** — `EventBus` とプラグイン検出を備えたイベント駆動アーキテクチャ
- **MCP クライアント** — stdio 経由の JSON-RPC 2.0 で Model Context Protocol をサポート
- **スラッシュコマンド** — セッション制御、モデル切り替え、診断用の 15 以上のコマンド
- **テーマシステム** — 5 つの組み込みテーマ：`mimo-dark`、`mimo-light`、`dracula`、`nord`、`solarized-dark`
- **マルチモード実行** — 対話型 REPL、単発プロンプト、パイプモード

## 🚀 クイックスタート

### 前提条件

- **Node.js** ≥ 18
- **npm** または **yarn**
- MiMo API キー（または OpenAI/Anthropic キー）

### インストール

```bash
git clone https://github.com/raaaaap/mimo-code.git
cd mimo-code
npm install
npm link          # 'mimo' コマンドをグローバルに登録
```

### 設定

**方法 A：環境変数**

```bash
export MIMO_API_KEY=your-api-key-here
```

**方法 B：設定ファイル**

`~/.mimo/settings.json` を作成：

```json
{
  "model": "mimo-v2.5",
  "apiKey": "your-api-key-here",
  "apiEndpoint": "https://api.mimo.ai/v1"
}
```

**方法 C：対話型セットアップ** — Mimo Code は初回起動時に設定を促します。

### 実行

```bash
# npm link 後、mimo コマンドを直接使用
mimo

# オプション付きで起動
mimo --theme dracula --model mimo-v2.5

# 開発モード（ホットリロード）
npm run dev

# グローバルリンクなしで実行
node bin/mimo.js --theme dracula
```

## 📖 使い方

### CLI オプション

```
mimo [options] [prompt]

Options:
  -m, --model <model>          使用するモデル（デフォルト："mimo-v2.5"）
  -k, --api-key <key>          API キー
  --api-endpoint <url>         API エンドポイント URL
  --mode <mode>                モード：interactive, single, pipe（デフォルト："interactive"）
  -v, --verbose                詳細出力
  --debug                      デバッグモード
  -o, --output <format>        出力形式：text, json, markdown
  --no-color                   カラー無効
  --theme <theme>              UI テーマ：mimo-dark, mimo-light, dracula, nord, solarized-dark
  --max-tokens <n>             最大トークン数（デフォルト：4096）
  --temperature <n>            温度（デフォルト：0.7）
  --permission-mode <mode>     パーミッションモード：default, acceptEdits, bypassPermissions, plan, auto
  -h, --help                   ヘルプを表示
  -V, --version                バージョンを表示
```

### 実行モード

```bash
# 対話型 REPL（デフォルト）
mimo

# 単発プロンプト
mimo --mode single "React hooks の使い方を説明して"

# パイプモード（stdin から読み取り）
echo "このコードは何をする？" | mimo --mode pipe
cat main.ts | mimo --mode pipe "このファイルを説明して"
```

### スラッシュコマンド

| コマンド | エイリアス | 説明 |
|----------|-----------|------|
| `/help` | | 利用可能なコマンドを表示 |
| `/clear` | | 画面をクリア |
| `/compact` | | 会話履歴を圧縮 |
| `/config` | | 現在の設定を表示 |
| `/commit` | `/ci` | 全変更をステージングしてコミット |
| `/diff` | | git diff を表示 |
| `/doctor` | | 診断を実行 |
| `/model` | `/m` | モードを表示または切り替え |
| `/theme` | `/t` | カラーテーマの表示または切り替え |
| `/language` | `/lang`, `/locale` | UI言語の表示または切り替え（zh-CN, en, ja） |
| `/usage` | | トークン使用量を表示 |
| `/status` | | セッション状態を表示 |
| `/permissions` | `/perms`, `/perm` | パーミッションモードを表示または設定 |
| `/plan` | | プランモードに入る |
| `/export` | | 会話をエクスポート |
| `/session` | | セッション管理 |
| `/skills` | | 利用可能なスキルを一覧表示 |
| `/tasks` | | タスク管理 |

### キーボードショートカット

| キー | アクション |
|------|-----------|
| `Enter` | 入力を送信 |
| `Shift+Enter` | 改行 |
| `Ctrl+C` | キャンセル / 終了 |
| `Ctrl+D` | 終了 |
| `Up/Down` | 履歴をナビゲート |
| `Escape` | 入力をクリア |

## 🏗️ アーキテクチャ

```
src/
├── entrypoints/       # CLI エントリポイント (cli.tsx, init.ts, mcp.ts)
├── main.tsx           # Commander CLI セットアップ、モード分岐
├── query.ts           # コアループ（非同期ジェネレーター）
├── QueryEngine.ts     # 会話ライフサイクルマネージャー
├── context.ts         # システムコンテキスト収集（git、cwd、日付）
├── screens/           # REPL 画面 (React/Ink)
├── components/        # UI コンポーネント
│   ├── Messages/      # 会話レンダリング
│   ├── PromptInput/   # ユーザー入力処理
│   ├── Mimo/          # アバター表示
│   ├── StructuredDiff/# 差分可視化
│   ├── HighlightedCode/# シンタックスハイライト
│   └── design-system/ # Button、Card、Table 基本コンポーネント
├── tools/             # 13 の組み込みツール実装
├── services/
│   ├── api/           # API クライアント + アダプター (OpenAI, Anthropic, MiMo)
│   ├── tools/         # ツール実行エンジンとオーケストレーション
│   ├── permissions/   # パーミッションチェッカー（5 モード）
│   ├── mcp/           # MCP クライアント (JSON-RPC 2.0 over stdio)
│   └── lsp/           # LSP クライアント（未実装）
├── plugins/           # EventBus + PluginManager + ローダー
├── commands/          # 15 以上のスラッシュコマンド
├── skills/            # スキルシステム (remember, simplify)
├── buddy/             # MiMo ネコマスコット（アニメーション ASCII アート）
├── state/             # カスタム状態ストア
├── utils/
│   ├── settings/      # 階層設定 (ユーザー → プロジェクト → ローカル → フラグ)
│   └── themes.ts      # 5 つの組み込みテーマ
├── modes/             # single.ts, pipe.ts
├── hooks/             # フックレジストリ
├── keybindings/       # キーバインドパーサー
├── history/           # 会話履歴ストア
├── session/           # セッション永続化
├── tasks/             # タスクマネージャー
├── telemetry/         # 使用テレメトリー
└── vim/               # Vim モード状態
```

### クエリループ

Mimo Code の中核は**クエリループ**（`query.ts`）です：

```
ユーザー入力 → システムプロンプト + コンテキスト → API リクエスト（ストリーミング）
    ↓
テキストチャンク → ターミナルに表示
ツール呼び出し → ToolRegistry 経由で実行 → 結果を追加 → ループ
    ↓
（最大 20 ターンまたはツール呼び出しがなくなるまで）
```

ツールはインテリジェントにオーケストレーションされます：並行安全なツール（読み取り専用）は並列実行され、破壊的なツールは順番に実行され、パーミッションチェックが行われます。

## ⚙️ 設定

### 設定階層

設定は 4 つのソースからマージされます（優先度が高い順）：

1. **CLI フラグ** — `--model`、`--api-key` など
2. **ローカル設定** — `.mimo/settings.local.json`（gitignore 済み）
3. **プロジェクト設定** — `.mimo/settings.json`
4. **ユーザー設定** — `~/.mimo/settings.json`

### 環境変数

| 変数 | 説明 |
|------|------|
| `MIMO_API_KEY` | MiMo API キー |
| `MIMO_API_ENDPOINT` | MiMo API エンドポイント（デフォルト：`https://api.mimo.ai/v1`） |
| `OPENAI_API_KEY` | OpenAI API キー（フォールバック） |
| `OPENAI_API_BASE` | OpenAI API ベース URL（フォールバック） |

### パーミッションモード

| モード | 説明 |
|--------|------|
| `default` | 破壊的な操作にパーミッションを要求 |
| `acceptEdits` | ファイルの読み取り/書き込み/編集を自動承認 |
| `bypassPermissions` | すべてを自動承認（注意して使用） |
| `plan` | 読み取り専用モード — 書き込みや実行なし |
| `auto` | ルールベース、フォールバックで確認 |

## 🧪 テスト

```bash
# 全テストを実行
npm test

# ウォッチモード
npm run test:watch

# 型チェック
npm run typecheck

# リント
npm run lint
```

プロジェクトには **61 のテストファイル**が含まれています：
- 全 13 ツールのユニットテスト
- API アダプタテスト (OpenAI, Anthropic, MiMo)
- クエリエンジンと会話フローのテスト
- プラグイン、パーミッション、設定システムのテスト
- エージェント会話フローの統合テスト

## 🤝 コントリビューション

コントリビューションを歓迎します！始め方：

1. リポジトリを **Fork**
2. 機能ブランチを作成：`git checkout -b feature/amazing-feature`
3. 変更をコミット：`git commit -m 'feat: add amazing feature'`
4. ブランチにプッシュ：`git push origin feature/amazing-feature`
5. Pull Request を作成

### 開発環境

```bash
git clone https://github.com/raaaaap/mimo-code.git
cd mimo-code
npm install
npm run dev
```

### コミット規約

このプロジェクトは [Conventional Commits](https://www.conventionalcommits.org/) に従います：

- `feat:` — 新機能
- `fix:` — バグ修正
- `docs:` — ドキュメント変更
- `refactor:` — コードリファクタリング
- `test:` — テストの追加または変更
- `chore:` — ビルド/ツール変更

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下でライセンスされています — 詳細は [LICENSE](LICENSE) ファイルをご覧ください。

---

<div align="center">

**MiMo エコシステムへの愛を込めて ❤️**

</div>
