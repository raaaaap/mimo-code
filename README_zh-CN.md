<p align="center">
  <img src="docs/logo.svg" alt="Mimo Code" width="640"/>
</p>

<p align="center">
  <a href="./README.md">English</a>
  &nbsp;·&nbsp;
  <strong>简体中文</strong>
  &nbsp;·&nbsp;
  <a href="./README_ja.md">日本語</a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&color=3b82f6&labelColor=161b22" alt="License: MIT"/></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-≥18-green.svg?style=flat-square&color=3fb950&labelColor=161b22&logo=nodedotjs&logoColor=white" alt="Node.js"/></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.5-blue.svg?style=flat-square&color=3178c6&labelColor=161b22&logo=typescript&logoColor=white" alt="TypeScript"/></a>
  <a href="https://github.com/raaaaap/mimo-code/stargazers"><img src="https://img.shields.io/github/stars/raaaaap/mimo-code.svg?style=flat-square&color=dbab09&labelColor=161b22&logo=github&logoColor=white" alt="GitHub stars"/></a>
</p>

<br/>

<h3 align="center">基于 MiMo 大语言模型的 CLI 编程助手</h3>
<p align="center">使用 TypeScript 和 Ink 构建 — 驻于终端的 AI 编程搭档。</p>

<br/>

<p align="center">
  <img src="docs/assets/hero-terminal.svg" alt="Mimo Code — 交互式 REPL，小米猫吉祥物，工具执行和代码生成" width="860"/>
</p>

<br/>

## 概述

Mimo Code 是一款终端 AI 编程助手，将 MiMo 大语言模型的能力融入开发工作流。基于 TypeScript 和 [Ink](https://github.com/vadimdemedes/ink)（React 终端框架）构建，提供交互式 REPL，你可以通过自然语言对话编写代码、执行命令、搜索文件和管理任务。


## ✨ 功能特性

### 🛠️ 13 个内置工具

| 工具 | 描述 | 并发 |
|------|------|:----:|
| **Bash** | 执行 Shell 命令，带超时保护 | ✅ |
| **PowerShell** | Windows 原生 PowerShell 执行，带危险命令屏蔽 | ✅ |
| **FileRead** | 读取文件，支持行号、偏移量和限制 | ✅ |
| **FileWrite** | 创建或覆盖文件，自动创建目录 | — |
| **FileEdit** | 精确字符串替换，强制唯一性检查 | — |
| **Glob** | 按模式查找文件（最多 200 个结果） | ✅ |
| **Grep** | 使用 ripgrep 搜索文件内容 | ✅ |
| **WebFetch** | 获取并提取 URL 内容 | ✅ |
| **WebSearch** | 通过 DuckDuckGo 搜索网页 | ✅ |
| **TodoWrite** | 管理任务列表，结构化输出 | ✅ |
| **NotebookEdit** | 编辑 Jupyter Notebook 单元格（插入/删除/替换） | — |
| **AskUserQuestion** | 交互式多选或开放式提示 | — |
| **Agent** | 生成自主子代理，拥有完整工具访问权限 | — |

### 🔌 多供应商 API 支持

- **MiMo** — 原生支持 1M 上下文窗口，自动压缩。模型：`mimo-v2.5-pro`（1T 参数，$1-2/M 输入），`mimo-v2.5`（$0.40-0.80/M 输入）
- **OpenAI** — 完整的 OpenAI 兼容 API，支持流式 SSE
- **Anthropic** — 直接集成 Claude API

### 🎨 更多能力

- **丰富的终端 UI** — 基于 React 的 REPL，支持语法高亮、差异对比和进度指示器
- **Markdown 渲染** — 终端中渲染标题、粗体、表格和行内代码
- **多语言界面** — 通过 `/language` 命令切换 简体中文、English、日本語
- **小米猫吉祥物** — 动画 ASCII 伙伴，随智能体状态变化（空闲 → 思考 → 编码 → 成功/错误）
- **权限系统** — 5 种模式：`default`、`acceptEdits`、`bypassPermissions`、`plan`、`auto`
- **插件系统** — 事件驱动架构，支持 `EventBus` 和插件发现
- **MCP 客户端** — 通过 stdio 的 JSON-RPC 2.0 支持 Model Context Protocol
- **斜杠命令** — 15+ 个命令，用于会话控制、模型切换和诊断
- **主题系统** — 5 个内置主题：`mimo-dark`、`mimo-light`、`dracula`、`nord`、`solarized-dark`
- **多模式执行** — 交互式 REPL、单次提示和管道模式

## 🚀 快速开始

### 前置要求

- **Node.js** ≥ 18
- **npm** 或 **yarn**
- MiMo API 密钥（或 OpenAI/Anthropic 密钥）

### 安装

```bash
git clone https://github.com/raaaaap/mimo-code.git
cd mimo-code
npm install
npm link          # 将 mimo 命令注册到全局
```

### 配置

**方式 A：环境变量**

```bash
export MIMO_API_KEY=your-api-key-here
```

**方式 B：配置文件**

创建 `~/.mimo/settings.json`：

```json
{
  "model": "mimo-v2.5",
  "apiKey": "your-api-key-here",
  "apiEndpoint": "https://api.mimo.ai/v1"
}
```

**方式 C：交互式设置** — Mimo Code 首次运行时会提示你配置。

### 运行

```bash
# npm link 后直接使用 mimo 命令
mimo

# 带选项启动
mimo --theme dracula --model mimo-v2.5

# 开发模式（热重载）
npm run dev

# 不使用全局链接直接运行
node bin/mimo.js --theme dracula
```

## 📖 使用方法

### CLI 选项

```
mimo [options] [prompt]

Options:
  -m, --model <model>          使用的模型（默认："mimo-v2.5"）
  -k, --api-key <key>          API 密钥
  --api-endpoint <url>         API 端点 URL
  --mode <mode>                模式：interactive, single, pipe（默认："interactive"）
  -v, --verbose                详细输出
  --debug                      调试模式
  -o, --output <format>        输出格式：text, json, markdown
  --no-color                   禁用颜色
  --theme <theme>              UI 主题：mimo-dark, mimo-light, dracula, nord, solarized-dark
  --max-tokens <n>             最大 token 数（默认：8192）
  --temperature <n>            温度（默认：0.7）
  --permission-mode <mode>     权限模式：default, acceptEdits, bypassPermissions, plan, auto
  -h, --help                   显示帮助
  -V, --version                显示版本
```

### 执行模式

```bash
# 交互式 REPL（默认）
mimo

# 单次提示
mimo --mode single "解释 React hooks 的用法"

# 管道模式（从 stdin 读取）
echo "这段代码做了什么？" | mimo --mode pipe
cat main.ts | mimo --mode pipe "解释这个文件"
```

### 斜杠命令

| 命令 | 别名 | 描述 |
|------|------|------|
| `/help` | | 显示可用命令 |
| `/clear` | | 清屏 |
| `/compact` | | 压缩对话历史 |
| `/config` | | 显示当前配置 |
| `/commit` | `/ci` | 暂存所有变更并提交 |
| `/diff` | | 显示 git diff |
| `/doctor` | | 运行诊断 |
| `/model` | `/m` | 显示或切换模型 |
| `/theme` | `/t` | 显示或切换颜色主题 |
| `/language` | `/lang`, `/locale` | 显示或切换界面语言（zh-CN, en, ja） |
| `/usage` | | 显示 token 使用量 |
| `/status` | | 显示会话状态 |
| `/permissions` | `/perms`, `/perm` | 显示或设置权限模式 |
| `/plan` | | 进入计划模式 |
| `/export` | | 导出对话 |
| `/session` | | 会话管理 |
| `/skills` | | 列出可用技能 |
| `/tasks` | | 任务管理 |

### 键盘快捷键

| 按键 | 操作 |
|------|------|
| `Enter` | 提交输入 |
| `Shift+Enter` | 换行 |
| `Ctrl+C` | 取消 / 退出 |
| `Ctrl+D` | 退出 |
| `Up/Down` | 浏览历史 |
| `Escape` | 清空输入 |

## 🏗️ 架构

```
src/
├── entrypoints/       # CLI 入口点 (cli.tsx, init.ts, mcp.ts)
├── main.tsx           # Commander CLI 设置，模式分发
├── query.ts           # 核心代理循环（异步生成器）
├── QueryEngine.ts     # 对话生命周期管理器
├── context.ts         # 系统上下文收集（git、cwd、日期）
├── screens/           # REPL 界面 (React/Ink)
├── components/        # UI 组件
│   ├── Messages/      # 对话渲染
│   ├── PromptInput/   # 用户输入处理
│   ├── Mimo/          # 头像显示
│   ├── StructuredDiff/# 差异可视化
│   ├── HighlightedCode/# 语法高亮
│   └── design-system/ # Button、Card、Table 基础组件
├── tools/             # 13 个内置工具实现
├── services/
│   ├── api/           # API 客户端 + 适配器 (OpenAI, Anthropic, MiMo)
│   ├── tools/         # 工具执行引擎与编排
│   ├── permissions/   # 权限检查器（5 种模式）
│   ├── mcp/           # MCP 客户端 (JSON-RPC 2.0 over stdio)
│   └── lsp/           # LSP 客户端（未实现）
├── plugins/           # EventBus + PluginManager + 加载器
├── commands/          # 15+ 个斜杠命令
├── skills/            # 技能系统 (remember, simplify)
├── buddy/             # 小米猫吉祥物（动画 ASCII 艺术）
├── state/             # 自定义状态存储
├── utils/
│   ├── settings/      # 分层配置 (用户 → 项目 → 本地 → 标志)
│   └── themes.ts      # 5 个内置主题
├── modes/             # single.ts, pipe.ts
├── hooks/             # 钩子注册
├── keybindings/       # 按键绑定解析器
├── history/           # 对话历史存储
├── session/           # 会话持久化
├── tasks/             # 任务管理器
├── telemetry/         # 使用遥测
└── vim/               # Vim 模式状态
```

### 查询循环

Mimo Code 的核心是**查询循环**（`query.ts`）：

```
用户输入 → 系统提示 + 上下文 → API 请求（流式）
    ↓
文本块 → 显示在终端
工具调用 → 通过 ToolRegistry 执行 → 追加结果 → 循环
    ↓
（最多 20 轮或直到没有更多工具调用）
```

工具智能编排：并发安全的工具（只读）并行执行，而破坏性工具按顺序执行并进行权限检查。

## ⚙️ 配置

### 设置层级

设置从四个来源合并（优先级从高到低）：

1. **CLI 标志** — `--model`、`--api-key` 等
2. **本地设置** — `.mimo/settings.local.json`（已 gitignore）
3. **项目设置** — `.mimo/settings.json`
4. **用户设置** — `~/.mimo/settings.json`

### 环境变量

| 变量 | 描述 |
|------|------|
| `MIMO_API_KEY` | MiMo API 密钥 |
| `MIMO_API_ENDPOINT` | MiMo API 端点（默认：`https://api.mimo.ai/v1`） |
| `OPENAI_API_KEY` | OpenAI API 密钥（备选） |
| `OPENAI_API_BASE` | OpenAI API 基础 URL（备选） |

### 权限模式

| 模式 | 描述 |
|------|------|
| `default` | 破坏性操作需请求权限 |
| `acceptEdits` | 自动批准文件读/写/编辑 |
| `bypassPermissions` | 自动批准所有操作（谨慎使用） |
| `plan` | 只读模式 — 无写入或执行 |
| `auto` | 基于规则，回退到询问 |

## 🧪 测试

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 类型检查
npm run typecheck

# 代码检查
npm run lint
```

项目包含 **61 个测试文件**，覆盖：
- 所有 13 个工具的单元测试
- API 适配器测试 (OpenAI, Anthropic, MiMo)
- 查询引擎和对话流程测试
- 插件、权限和设置系统测试
- 代理对话流程的集成测试

## 🤝 贡献指南

欢迎贡献！以下是入门步骤：

1. **Fork** 仓库
2. **创建** 功能分支：`git checkout -b feature/amazing-feature`
3. **提交** 更改：`git commit -m 'feat: add amazing feature'`
4. **推送** 到分支：`git push origin feature/amazing-feature`
5. **发起** Pull Request

### 开发环境

```bash
git clone https://github.com/raaaaap/mimo-code.git
cd mimo-code
npm install
npm run dev
```

### 提交规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` — 新功能
- `fix:` — Bug 修复
- `docs:` — 文档更改
- `refactor:` — 代码重构
- `test:` — 测试添加或更改
- `chore:` — 构建/工具更改

## 📄 许可证

本项目基于 MIT 许可证 — 详见 [LICENSE](LICENSE) 文件。

---

<div align="center">

**为 MiMo 生态系统倾心打造 ❤️**

</div>
