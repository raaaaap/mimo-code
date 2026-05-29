# Mimo Coding Agent - 快速启动指南

## 项目概述

Mimo Coding Agent 是一个专为 Mimo 大模型设计的命令行编码智能体，参考 Claude Code 架构构建。支持多模型适配器（OpenAI/Anthropic/Mimo）、8 个内置工具、权限系统、插件系统和 MCP 协议。

## 技术栈

| 层次 | 技术 |
|------|------|
| 运行时 | Node.js >= 18 |
| 语言 | TypeScript 5.x |
| CLI 框架 | Ink (React for CLI) |
| CLI 解析 | Commander.js |
| 构建 | tsup (esbuild) |
| 测试 | Vitest |

## 快速开始

### 1. 安装依赖

```bash
cd mimo-code/mimo-code
npm install
```

### 2. 配置 API Key

```bash
# 方式一：环境变量
export MIMO_API_KEY=your-api-key-here

# 方式二：配置文件 ~/.mimo/settings.json
mkdir -p ~/.mimo
cat > ~/.mimo/settings.json << 'EOF'
{
  "model": "mimo-large",
  "apiKey": "your-api-key-here",
  "apiEndpoint": "https://api.mimo.ai/v1"
}
EOF

# 方式三：命令行参数
npm run dev -- --api-key your-api-key-here
```

### 3. 运行

```bash
# 开发模式（推荐）
npm run dev

# 构建后运行
npm run build
node bin/mimo.js

# 或全局安装后直接使用
npm link
mimo
```

> **注意：** 所有命令都需要在 `mimo-code/mimo-code/` 子目录下执行。

## CLI 选项

```
mimo [选项] [提示]

选项:
  -m, --model <model>          使用的模型 (默认: "mimo-large")
  -k, --api-key <key>          API 密钥
  --api-endpoint <url>         API 端点 URL
  --mode <mode>                模式: interactive, single, pipe (默认: "interactive")
  -v, --verbose                详细输出
  --debug                      调试模式
  -o, --output <format>        输出格式: text, json, markdown
  --no-color                   禁用颜色
  --theme <theme>              主题: mimo-dark, mimo-light, matrix, ocean
  --max-tokens <n>             最大 token 数 (默认: 4096)
  --temperature <n>            温度 (默认: 0.7)
  --permission-mode <mode>     权限模式: default, acceptEdits, bypassPermissions, plan, auto
  -h, --help                   显示帮助
  -V, --version                显示版本
```

## 斜杠命令

| 命令 | 说明 |
|------|------|
| /help | 显示可用命令 |
| /clear | 清屏 |
| /compact | 压缩对话历史 |
| /config | 显示当前配置 |

## 快捷键

| 按键 | 功能 |
|------|------|
| Enter | 提交输入 |
| Shift+Enter | 换行 |
| Ctrl+C | 取消 / 退出 |
| Ctrl+D | 退出 |
| 上/下 | 浏览历史 |
| Escape | 清空输入 |

## 内置工具

| 工具 | 功能 | 特性 |
|------|------|------|
| BashTool | 执行 shell 命令 | 破坏性 |
| FileReadTool | 读取文件 | 只读、并发安全 |
| FileEditTool | 精确字符串替换 | — |
| FileWriteTool | 写入文件 | 破坏性 |
| GrepTool | ripgrep 文本搜索 | 只读、并发安全 |
| GlobTool | 文件模式匹配 | 只读、并发安全 |
| WebFetchTool | 网页抓取 | 只读、并发安全 |
| TodoWriteTool | 任务列表管理 | — |

## 主题系统

4 个内置主题：

- `mimo-dark` — 深色主题（默认），Mimo 蓝色调
- `mimo-light` — 浅色主题
- `matrix` — 黑客帝国风格
- `ocean` — 海洋风格

切换主题：
```bash
mimo --theme matrix
```

## 权限模式

| 模式 | 说明 |
|------|------|
| `default` | 危险操作需确认 |
| `acceptEdits` | 文件编辑自动允许 |
| `bypassPermissions` | 全部允许（危险） |
| `plan` | 只允许读取操作 |
| `auto` | LLM 分类器判断 |

## 项目结构

```
mimo-code/
├── bin/mimo.js              # 可执行入口
├── src/
│   ├── types/               # 核心类型
│   ├── state/               # 状态管理
│   ├── services/
│   │   ├── api/             # API 客户端 + 适配器
│   │   ├── tools/           # 工具执行引擎
│   │   ├── permissions/     # 权限系统
│   │   └── mcp/             # MCP 客户端
│   ├── tools/               # 8 个内置工具
│   ├── plugins/             # 插件系统
│   ├── commands/            # 斜杠命令
│   ├── components/          # UI 组件
│   ├── utils/               # 工具函数
│   ├── QueryEngine.ts       # 查询引擎
│   ├── query.ts             # 查询循环
│   └── screens/             # REPL 屏幕
├── tests/                   # 测试
└── docs/                    # 文档
```

## 测试

```bash
npm test              # 运行所有测试
npm run test:watch    # 监听模式
npm run typecheck     # 类型检查
```

## 开发里程碑

| Phase | 内容 | 状态 |
|-------|------|------|
| Phase 1 | 基础架构（脚手架、类型、API、REPL） | Done |
| Phase 2 | 核心引擎（QueryEngine、Tool 系统） | Done |
| Phase 3 | 基础工具（8 个工具） | Done |
| Phase 4 | 高级功能（权限、插件、MCP、Anthropic） | Done |
| Phase 5 | 打磨（主题、动画、测试） | Done |
| Phase 6 | 发布准备（README、打包、文档） | Done |

## 统计

- **22 个 commit**
- **68 个测试**（21 个测试文件）
- **35+ 源文件**
- **完整的 agent 循环可用**
