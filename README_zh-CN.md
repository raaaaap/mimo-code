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

<h3 align="center">基于 MiMo 大语言模型的终端 AI 编程助手</h3>
<p align="center">使用 TypeScript 和 Ink 构建 — 驻于终端的 AI 编程搭档。</p>

<br/>

<p align="center">
  <img src="docs/assets/hero-terminal.svg" alt="Mimo Code — 交互式 REPL，小米猫吉祥物，工具执行和代码生成" width="860"/>
</p>

<br/>

## 概述

Mimo Code 是一款终端 AI 编程助手，由 MiMo 大语言模型驱动。基于 TypeScript 和 [Ink](https://github.com/vadimdemedes/ink)（React 终端框架）构建，提供交互式 REPL，你可以通过自然语言对话编写代码、执行命令、搜索文件和管理任务。

## ✨ 功能特性

### 🛠️ 33 个内置工具

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
| **ToolSearch** | 按关键词搜索可用工具 | ✅ |
| **EnterPlanMode** | 进入计划模式（只读，禁止写入） | ✅ |
| **ExitPlanMode** | 退出计划模式，提交计划供审批 | — |
| **TaskOutput** | 获取后台任务输出，支持阻塞等待 | ✅ |
| **TaskStop** | 停止正在运行的后台任务 | — |
| **SendMessage** | 代理间通信（支持广播） | — |
| **ListMcpResources** | 列出可用的 MCP 资源 | ✅ |
| **ReadMcpResource** | 按 URI 读取 MCP 资源 | ✅ |
| **EnterWorktree** | 创建并进入 git worktree 进行隔离工作 | — |
| **ExitWorktree** | 退出并可选删除 git worktree | — |
| **SkillTool** | 程序化调用技能/斜杠命令 | — |
| **LSPTool** | 语言服务器协议，代码导航 | ✅ |
| **MCPTool** | 调用已连接 MCP 服务器上的工具 | — |
| **BriefTool** | 发送带附件的结构化消息 | ✅ |
| **ConfigTool** | 程序化读取/修改设置 | — |
| **TaskCreate** | 创建新任务用于跟踪 | — |
| **TaskGet** | 按 ID 获取任务详情 | ✅ |
| **TaskUpdate** | 更新任务状态/标题/描述 | — |
| **TaskList** | 列出所有任务，可选过滤 | ✅ |
| **ScheduleCron** | 用 cron 调度定时任务 | — |

### 🔌 多供应商 API 支持

| 供应商 | Base URL | API Key 格式 | 协议 |
|--------|----------|--------------|------|
| **MiMo 按量付费** | `https://api.xiaomimimo.com/v1` | `sk-xxxxx` | OpenAI |
| **MiMo 按量付费** | `https://api.xiaomimimo.com/anthropic` | `sk-xxxxx` | Anthropic |
| **MiMo Token Plan** | `https://token-plan-cn.xiaomimimo.com/v1` | `tp-xxxxx` | OpenAI |
| **MiMo Token Plan** | `https://token-plan-cn.xiaomimimo.com/anthropic` | `tp-xxxxx` | Anthropic |
| **OpenAI** | 任何 OpenAI 兼容端点 | `sk-xxxxx` | OpenAI |
| **Anthropic** | `https://api.anthropic.com` | `sk-ant-xxxxx` | Anthropic |

### 🎨 更多能力

- **本地化系统提示词** — LLM 使用你选择的语言回复（简体中文、English、日本語）
- **丰富的终端 UI** — 基于 React 的 REPL，支持语法高亮、差异对比和进度指示器
- **Markdown 渲染** — 终端中渲染标题、粗体、表格和行内代码
- **推理模式** — 扩展推理，可折叠显示思考过程
- **计划模式** — 执行前的只读规划阶段，用户确认后执行
- **工具搜索** — 按关键词或直接选择发现可用工具
- **后台任务** — 长时间运行任务的输出获取和停止控制
- **代理间通信** — 子代理之间的消息总线
- **多语言界面** — 通过 `/language` 命令切换 简体中文、English、日本語
- **会话持久化** — 对话自动保存到 `~/.mimo/sessions/`
- **费用追踪** — 每次会话的 token 使用量和费用统计
- **个性化命令** — TAB 显示你最常用的命令
- **小米猫吉祥物** — 动画 ASCII 伙伴，随智能体状态变化（空闲 → 思考 → 编码 → 成功/错误）
- **权限系统** — 5 种模式：`default`、`acceptEdits`、`bypassPermissions`、`plan`、`auto`
- **插件系统** — 事件驱动架构，支持 `EventBus` 和插件发现
- **MCP 客户端** — 通过 stdio 的 JSON-RPC 2.0 支持 Model Context Protocol
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
export MIMO_API_KEY=sk-your-api-key-here
export MIMO_BASE_URL=https://api.xiaomimimo.com/v1
```

**方式 B：配置文件**

创建 `~/.mimo/settings.json`：

```json
{
  "model": "mimo-v2.5",
  "apiKey": "sk-your-api-key-here",
  "baseUrl": "https://api.xiaomimimo.com/v1"
}
```

**方式 C：交互式设置** — Mimo Code 首次运行时会提示你配置。

### 运行

```bash
# npm link 后直接使用 mimo 命令
mimo

# 带选项运行
mimo --theme dracula --model mimo-v2.5

# 开发模式（热重载）
npm run dev

# 或不使用全局链接运行
node bin/mimo.js --theme dracula
```

## 📖 使用说明

### CLI 选项

```
mimo [选项] [提示]

选项：
  -m, --model <model>          使用的模型（默认："mimo-v2.5"）
  -k, --api-key <key>          API 密钥
  --base-url <url>             API Base URL
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
echo "这段代码是做什么的？" | mimo --mode pipe
cat main.ts | mimo --mode pipe "解释这个文件"
```

### 斜杠命令（46 个）

| 命令 | 别名 | 描述 |
|------|------|------|
| `/help` | | 按分类显示所有命令 |
| `/clear` | | 清屏 |
| `/compact` | | 压缩对话历史 |
| `/config` | | 显示或设置配置 |
| `/commit` | `/ci` | 暂存所有更改并提交 |
| `/context` | | 显示当前上下文窗口状态 |
| `/cost` | | 显示本次会话费用明细 |
| `/diff` | | 显示 git diff |
| `/doctor` | | 运行诊断 |
| `/effort` | | 调整推理努力程度 |
| `/export` | | 导出对话到文件 |
| `/fast` | | 切换快速模式 |
| `/files` | | 列出会话中修改的文件 |
| `/model` | `/m` | 显示或切换模型 |
| `/theme` | `/t` | 显示或切换颜色主题 |
| `/language` | `/lang`, `/locale` | 显示或切换界面语言（zh-CN, en, ja） |
| `/mcp` | | MCP 服务器管理 |
| `/memory` | | 查看或编辑持久化记忆 |
| `/permissions` | `/perms`, `/perm` | 显示或设置权限模式 |
| `/plan` | | 进入计划模式 |
| `/rename` | | 重命名当前会话 |
| `/resume` | | 恢复之前的会话 |
| `/review` | | 审查最近的更改 |
| `/session` | | 会话管理 |
| `/skills` | | 列出可用技能 |
| `/stats` | | 显示会话统计 |
| `/status` | | 显示会话状态 |
| `/tasks` | | 任务管理 |
| `/usage` | | 显示 token 使用量 |
| `/vim` | | 切换 vim 键绑定模式 |
| `/buddy` | | 小米猫吉祥物设置 |
| `/branch` | | 显示或切换 git 分支 |
| `/login` | | MiMo API 认证 |
| `/logout` | | 清除认证 |
| `/add-dir` | | 添加工作目录 |
| `/copy` | | 复制最后回复到剪贴板 |
| `/env` | | 显示相关环境变量 |
| `/feedback` | | 发送反馈 |
| `/init` | | 初始化项目配置 |
| `/issue` | | 报告问题 |
| `/keybindings` | | 显示或配置键绑定 |
| `/output-style` | | 设置输出风格 |
| `/pr_comments` | | 显示 PR 评论 |
| `/sandbox-toggle` | | 切换沙箱模式 |
| `/upgrade` | | 检查更新 |

### 键盘快捷键

| 按键 | 操作 |
|------|------|
| `Enter` | 提交输入 |
| `Shift+Enter` | 换行 |
| `Ctrl+C` | 取消 / 退出 |
| `Ctrl+D` | 退出 |
| `Up/Down` | 浏览历史 |
| `Escape` | 清除输入 |
| `Tab` | 切换命令菜单（显示你最常用的命令） |

## 🏗️ 架构

```
src/
├── entrypoints/       # CLI 入口（cli.tsx, init.ts, mcp.ts）
├── main.tsx           # Commander CLI 设置，模式分发
├── query.ts           # 核心代理循环（异步生成器）
├── QueryEngine.ts     # 对话生命周期管理器
├── context.ts         # 系统上下文收集（git, cwd, date）
├── constants/         # 系统提示词（本地化）
├── screens/           # REPL 屏幕（React/Ink）
├── components/        # UI 组件
│   ├── Messages/      # 对话渲染（支持 Markdown）
│   ├── PromptInput/   # 用户输入处理
│   ├── StatusLine/    # 执行状态显示
│   ├── StructuredDiff/# 差异可视化
│   ├── HighlightedCode/# 语法高亮
│   └── design-system/ # Button, Card, Table 基础组件
├── tools/             # 23 个内置工具实现
├── commands/          # 48 个斜杠命令（全部支持 i18n）
├── services/
│   ├── api/           # API 客户端 + 适配器（OpenAI, MiMo）
│   ├── tools/         # 工具执行引擎和编排
│   ├── compact/       # 上下文压缩和 token 预算
│   ├── permissions/   # 权限检查器（5 种模式）
│   └── mcp/           # MCP 客户端（JSON-RPC 2.0 over stdio）
├── state/             # 应用状态管理（React context）
├── session/           # 会话持久化
├── utils/
│   ├── settings/      # 分层配置（用户 → 项目 → 本地 → 标志）
│   ├── i18n.ts        # 国际化（zh-CN, en, ja）
│   ├── themes.ts      # 5 个内置主题
│   └── commandUsage.ts # 命令使用追踪
├── buddy/             # 小米猫吉祥物（动画 ASCII）
├── plugins/           # EventBus + PluginManager + loader
├── skills/            # 技能系统（remember, simplify）
├── hooks/             # 钩子注册
└── vim/               # Vim 模式状态
```

### 查询循环

Mimo Code 的核心是**查询循环**（`query.ts`）：

```
用户输入 → 本地化系统提示词 + 上下文 → API 请求（流式）
    ↓
文本块 → 在终端显示（支持 Markdown 渲染）
工具调用 → 通过 ToolRegistry 执行 → 追加结果 → 循环
    ↓
（最多 20 轮或直到没有更多工具调用）
```

工具智能编排：并发安全的工具（只读）并行运行，破坏性工具按顺序运行并进行权限检查。

## ⚙️ 配置

### 设置层级

设置从四个来源合并（优先级从高到低）：

1. **CLI 标志** — `--model`、`--api-key` 等
2. **本地设置** — `.mimo/settings.local.json`（gitignore）
3. **项目设置** — `.mimo/settings.json`
4. **用户设置** — `~/.mimo/settings.json`

### 环境变量

| 变量 | 描述 |
|------|------|
| `MIMO_API_KEY` | MiMo API 密钥（`sk-` 或 `tp-` 前缀） |
| `MIMO_BASE_URL` | MiMo API Base URL（默认：`https://api.xiaomimimo.com/v1`） |
| `OPENAI_API_KEY` | OpenAI API 密钥（备选） |
| `OPENAI_API_BASE` | OpenAI API 基础 URL（备选） |

### 权限模式

| 模式 | 描述 |
|------|------|
| `default` | 对破坏性操作请求权限 |
| `acceptEdits` | 自动批准文件读写编辑 |
| `bypassPermissions` | 自动批准所有操作（谨慎使用） |
| `plan` | 只读模式 — 禁止写入和执行 |
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

项目包含 **62 个测试文件**，**432 个测试**，覆盖：
- 所有 23 个工具的单元测试
- API 适配器测试（OpenAI, MiMo）
- 查询引擎和对话流程测试
- 插件、权限和设置系统测试
- 代理对话流程集成测试

## 🤝 贡献

欢迎贡献！以下是入门指南：

1. **Fork** 仓库
2. **创建** 功能分支：`git checkout -b feature/amazing-feature`
3. **提交** 更改：`git commit -m 'feat: add amazing feature'`
4. **推送** 到分支：`git push origin feature/amazing-feature`
5. **打开** Pull Request

### 开发设置

```bash
git clone https://github.com/raaaaap/mimo-code.git
cd mimo-code
npm install
npm run dev
```

### 提交规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat:` — 新功能
- `fix:` — Bug 修复
- `docs:` — 文档更改
- `refactor:` — 代码重构
- `test:` — 测试添加或更改
- `chore:` — 构建/工具更改

## 🙏 致谢

- **[Anthropic](https://www.anthropic.com/)** — 原创 Claude Code 架构和设计模式，为本项目提供了灵感
- **[Ink](https://github.com/vadimdemedes/ink)** — 基于 React 的终端 UI 框架
- **[Commander.js](https://github.com/tj/commander.js)** — CLI 参数解析
- **[Zod](https://github.com/colinhacks/zod)** — TypeScript 优先的模式验证
- **[clipboardy](https://github.com/sindresorhus/clipboardy)** — 跨平台剪贴板访问
- **[MiMo](https://platform.xiaomimimo.com)** — 驱动本助手的大语言模型

## 📄 许可证

本项目基于 MIT 许可证 — 详见 [LICENSE](LICENSE) 文件。

---

<div align="center">

**为 MiMo 生态系统用心构建 ❤️**

</div>
