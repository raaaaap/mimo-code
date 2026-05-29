# mimo-code 全功能实现路线图

**日期:** 2026-05-29
**状态:** Draft
**范围:** 43 个待实现功能的分阶段实现计划

---

## 1. 总览

mimo-code 当前完成度约 20%（8/40+ 工具，5/80+ 命令）。本路线图将 43 个待实现功能分为 7 个阶段，每个阶段有明确主题、依赖关系和验收标准。

### 阶段依赖图

```
Phase 1 (核心能力)
  ├── Phase 2 (工具扩展)
  └── Phase 3 (可扩展性框架)
        ├── Phase 4 (用户体验)
        ├── Phase 5 (智能特性)
        ├── Phase 6 (生态集成)
        └── Phase 7 (高级 UI)
```

### 预估总工作量

| 阶段 | 功能数 | 预估工时 | 优先级 |
|------|--------|---------|--------|
| Phase 1 | 5 | 3-4 天 | P0 |
| Phase 2 | 5 | 3-4 天 | P0 |
| Phase 3 | 4 | 4-5 天 | P1 |
| Phase 4 | 6 | 3-4 天 | P1 |
| Phase 5 | 5 | 4-5 天 | P1 |
| Phase 6 | 10 | 5-7 天 | P2 |
| Phase 7 | 8 | 5-7 天 | P2/P3 |
| **总计** | **43** | **27-36 天** | — |

---

## 2. Phase 1: 核心能力补齐

**目标:** 让 mimo-code 从"能用"变成"好用"
**前置依赖:** 无
**验收标准:** 非交互模式可用，长对话不丢失上下文

### 2.1 Single/Pipe 模式

| 项目 | 内容 |
|------|------|
| 功能 | 支持 `mimo "fix the bug in main.ts"` 和 `echo "explain this" \| mimo` |
| 文件 | 修改 `src/main.tsx`，新增 `src/modes/single.ts`、`src/modes/pipe.ts` |
| 依赖 | 无 |
| 实现要点 | Commander.js 新增 `argument` 模式；pipe 模式从 stdin 读取；输出到 stdout（无 TUI）；退出码 0/1 表示成功/失败 |
| 测试 | `tests/unit/modes/single.test.ts`、`tests/unit/modes/pipe.test.ts` |

### 2.2 流式工具执行

| 项目 | 内容 |
|------|------|
| 功能 | 模型还在输出时就开始执行已返回的工具调用 |
| 文件 | 修改 `src/query.ts`，增强 `src/services/tools/StreamingToolExecutor.ts` |
| 依赖 | 无 |
| 实现要点 | 解析 SSE 流中的 `tool_use` 块，遇到完整工具调用立即并行执行；维护工具执行顺序以正确拼装结果 |
| 测试 | `tests/unit/query/streaming-tools.test.ts` |

### 2.3 Token 预算管理

| 项目 | 内容 |
|------|------|
| 功能 | 基于 90% 阈值的自动续写决策、收益递减检测 |
| 文件 | 新增 `src/query/tokenBudget.ts`，修改 `src/query.ts` |
| 依赖 | 无 |
| 实现要点 | 跟踪每轮 token 用量；当剩余 <10% 时自动触发压缩；连续 3 轮增量 <500 token 时停止续写 |
| 测试 | `tests/unit/query/tokenBudget.test.ts` |

### 2.4 工具调用摘要

| 项目 | 内容 |
|------|------|
| 功能 | 压缩冗长的工具输出为摘要 |
| 文件 | 新增 `src/services/tools/toolSummary.ts`，修改 `src/query.ts` |
| 依赖 | 无 |
| 实现要点 | 当工具输出 > 阈值（如 5000 chars）时，用 LLM 生成摘要替换原始输出；保留前 500 + 后 500 字符 |
| 测试 | `tests/unit/tools/toolSummary.test.ts` |

### 2.5 历史持久化

| 项目 | 内容 |
|------|------|
| 功能 | 对话历史存储到磁盘，支持恢复 |
| 文件 | 新增 `src/history.ts`、`src/history/store.ts` |
| 依赖 | 无 |
| 实现要点 | JSON 格式存储到 `~/.mimo/history/`；每条记录含时间戳、模型、消息、token 用量；最多保留 100 条；支持 `/resume` 命令恢复 |
| 测试 | `tests/unit/history/store.test.ts` |

---

## 3. Phase 2: 工具扩展

**目标:** 补齐 Claude Code 的核心工具集
**前置依赖:** Phase 1（流式工具执行）
**验收标准:** 至少 13 个工具可用

### 3.1 AgentTool（子代理）

| 项目 | 内容 |
|------|------|
| 功能 | 派生子代理执行独立任务 |
| 文件 | 新增 `src/tools/AgentTool/AgentTool.ts`、`src/agent/` |
| 依赖 | Phase 1 流式工具执行 |
| 实现要点 | 创建子 QueryEngine 实例；隔离的消息历史；内置 agent 类型（explore、plan、verify）；结果汇总返回父代理 |
| 测试 | `tests/unit/tools/AgentTool.test.ts` |

### 3.2 WebSearchTool

| 项目 | 内容 |
|------|------|
| 功能 | 网络搜索 |
| 文件 | 新增 `src/tools/WebSearchTool/WebSearchTool.ts` |
| 依赖 | 无 |
| 实现要点 | 集成搜索 API（Brave Search / SerpAPI / 自定义）；返回标题、URL、摘要；结果数量限制 |
| 测试 | `tests/unit/tools/WebSearchTool.test.ts` |

### 3.3 NotebookEditTool

| 项目 | 内容 |
|------|------|
| 功能 | Jupyter notebook 编辑 |
| 文件 | 新增 `src/tools/NotebookEditTool/NotebookEditTool.ts` |
| 依赖 | 无 |
| 实现要点 | 解析 .ipynb JSON 结构；支持插入、删除、替换 cell；支持 code/markdown cell 类型 |
| 测试 | `tests/unit/tools/NotebookEditTool.test.ts` |

### 3.4 AskUserQuestionTool

| 项目 | 内容 |
|------|------|
| 功能 | 向用户提问澄清需求 |
| 文件 | 新增 `src/tools/AskUserQuestionTool/AskUserQuestionTool.ts` |
| 依赖 | 无 |
| 实现要点 | 在 REPL 中显示问题；支持单选/多选/开放题；超时后使用默认答案 |
| 测试 | `tests/unit/tools/AskUserQuestionTool.test.ts` |

### 3.5 PowerShellTool

| 项目 | 内容 |
|------|------|
| 功能 | Windows PowerShell 执行 |
| 文件 | 新增 `src/tools/PowerShellTool/PowerShellTool.ts` |
| 依赖 | 无 |
| 实现要点 | 检测 PowerShell 版本（5.1 / 7+）；CLM 安全检查；git 命令安全转换；与 BashTool 共享安全分析逻辑 |
| 测试 | `tests/unit/tools/PowerShellTool.test.ts` |

---

## 4. Phase 3: 可扩展性框架

**目标:** 建立插件、技能、Hook 的扩展基础设施
**前置依赖:** Phase 1
**验收标准:** 第三方可通过 MCP/Skills/Hook 扩展 mimo-code

### 4.1 Skills 系统

| 项目 | 内容 |
|------|------|
| 功能 | 可扩展的斜杠命令系统 |
| 文件 | 新增 `src/skills/`（6-8 个文件） |
| 依赖 | 无 |
| 实现要点 | 从 `.mimo/skills/` 目录加载；frontmatter 解析（name, description, allowedTools）；内置 skills（remember, simplify, verify）；MCP skill 桥接 |
| 测试 | `tests/unit/skills/loader.test.ts`、`tests/unit/skills/builtin.test.ts` |

### 4.2 Hook 系统

| 项目 | 内容 |
|------|------|
| 功能 | 26 种 hook 事件（PreToolUse、PostToolUse、SessionStart 等） |
| 文件 | 新增 `src/hooks/`（3-4 个文件），修改 `src/schemas/` |
| 依赖 | 无 |
| 实现要点 | Hook 类型：command（shell）、agent（子代理）、prompt（SDK 回调）；if 条件过滤；异步/同步执行；超时控制 |
| 测试 | `tests/unit/hooks/registry.test.ts`、`tests/unit/hooks/execution.test.ts` |

### 4.3 MCP 完整实现

| 项目 | 内容 |
|------|------|
| 功能 | stdio/sse/http 传输、工具发现、资源读取 |
| 文件 | 重写 `src/services/mcp/client.ts`，新增 `src/services/mcp/transport/` |
| 依赖 | 无 |
| 实现要点 | stdio 传输（子进程通信）；SSE 传输（HTTP 长连接）；工具自动注册到 ToolRegistry；资源读取（ListMcpResources、ReadMcpResource）；认证支持 |
| 测试 | `tests/unit/mcp/client.test.ts`、`tests/unit/mcp/transport.test.ts` |

### 4.4 Plugin 系统完整实现

| 项目 | 内容 |
|------|------|
| 功能 | 加载、生命周期、能力声明、SDK |
| 文件 | 增强 `src/plugins/manager.ts`，新增 `src/plugins/loader.ts`、`src/plugins/sdk/` |
| 依赖 | Hook 系统 |
| 实现要点 | 从 `node_modules/@mimo-code/plugin-*` 自动发现；生命周期管理（load/unload）；能力声明（command、tool、hook、theme）；PluginContext 注入 |
| 测试 | `tests/unit/plugins/loader.test.ts`、`tests/unit/plugins/lifecycle.test.ts` |

---

## 5. Phase 4: 用户体验

**目标:** 提升终端交互体验
**前置依赖:** Phase 2（工具扩展后 UI 需求更复杂）
**验收标准:** 快捷键可用，diff 可视化

### 5.1 快捷键系统

| 项目 | 内容 |
|------|------|
| 功能 | 可自定义快捷键、chord 支持、平台感知 |
| 文件 | 新增 `src/keybindings/`（5-6 个文件） |
| 依赖 | 无 |
| 实现要点 | 默认快捷键表；用户自定义 `keybindings.json`；chord 支持（ctrl+x ctrl+k）；平台感知（Windows/Mac/Linux） |
| 测试 | `tests/unit/keybindings/parser.test.ts`、`tests/unit/keybindings/matcher.test.ts` |

### 5.2 Vim 模式

| 项目 | 内容 |
|------|------|
| 功能 | 完整 vim 状态机 |
| 文件 | 新增 `src/vim/`（5 个文件） |
| 依赖 | 快捷键系统 |
| 实现要点 | INSERT/NORMAL 模式；motions（h/l/w/b/e/0/$等）；operators（d/c/y）；text objects（iw/aw/i"/a"等）；registers；dot-repeat |
| 测试 | `tests/unit/vim/motions.test.ts`、`tests/unit/vim/operators.test.ts` |

### 5.3 语法高亮 diff

| 项目 | 内容 |
|------|------|
| 功能 | 带语法高亮的文件差异显示 |
| 文件 | 新增 `src/native-ts/color-diff/` |
| 依赖 | 无 |
| 实现要点 | 使用 `diff` 包生成差异；使用 `highlight.js` 语法高亮；支持 BAT_THEME 环境变量；word diff 支持 |
| 测试 | `tests/unit/color-diff/renderer.test.ts` |

### 5.4 结构化 diff 组件

| 项目 | 内容 |
|------|------|
| 功能 | 可视化文件变更 |
| 文件 | 新增 `src/components/StructuredDiff/` |
| 依赖 | 语法高亮 diff |
| 实现要点 | Ink 组件渲染 diff；行号显示；添加/删除/修改高亮；折叠/展开 |
| 测试 | 组件级测试 |

### 5.5 代码高亮组件

| 项目 | 内容 |
|------|------|
| 功能 | 代码块语法高亮 |
| 文件 | 新增 `src/components/HighlightedCode/` |
| 依赖 | 无 |
| 实现要点 | highlight.js 集成；终端 ANSI 颜色输出；语言自动检测 |
| 测试 | 组件级测试 |

### 5.6 Spinner 组件

| 项目 | 内容 |
|------|------|
| 功能 | 加载动画 |
| 文件 | 新增 `src/components/Spinner/` |
| 依赖 | 无 |
| 实现要点 | 多种 spinner 样式（dots、line、arc）；自定义文本；自动停止 |
| 测试 | 组件级测试 |

---

## 6. Phase 5: 智能特性

**目标:** 让 mimo-code 更智能、更自主
**前置依赖:** Phase 3（需要 Hook/Skills 支撑）
**验收标准:** 自动记忆可用，后台任务可运行

### 6.1 自动记忆系统

| 项目 | 内容 |
|------|------|
| 功能 | MEMORY.md + 记忆类型 + 自动提取 |
| 文件 | 新增 `src/memdir/`（5-6 个文件） |
| 依赖 | Hook 系统（Stop Hooks） |
| 实现要点 | 记忆类型：user/feedback/project/reference；MEMORY.md 入口文件（200 行上限）；findRelevantMemories 用 LLM 选择相关记忆；后台自动提取 |
| 测试 | `tests/unit/memdir/store.test.ts`、`tests/unit/memdir/discovery.test.ts` |

### 6.2 后台任务系统

| 项目 | 内容 |
|------|------|
| 功能 | 7 种任务类型（shell/agent/remote/teammate/workflow/monitor/dream） |
| 文件 | 新增 `src/tasks/`（8-10 个文件） |
| 依赖 | 无 |
| 实现要点 | TaskStateBase 抽象；LocalShellTask（后台 bash）；LocalAgentTask（后台 agent）；任务状态机（pending→running→completed/failed/killed）；输出文件追踪 |
| 测试 | `tests/unit/tasks/shell.test.ts`、`tests/unit/tasks/agent.test.ts` |

### 6.3 费用追踪

| 项目 | 内容 |
|------|------|
| 功能 | token 用量、USD 成本计算 |
| 文件 | 新增 `src/cost-tracker.ts`、`src/costHook.ts` |
| 依赖 | 无 |
| 实现要点 | 按模型统计 input/output/cache token；USD 成本计算（模型定价表）；`/cost` 命令显示；session 级和 total 级统计 |
| 测试 | `tests/unit/cost-tracker.test.ts` |

### 6.4 Thinking 模式

| 项目 | 内容 |
|------|------|
| 功能 | 自适应/启用 thinking 配置 |
| 文件 | 修改 `src/query.ts`、`src/types/api.ts` |
| 依赖 | 无 |
| 实现要点 | ModelRequest 新增 thinking 字段；自适应模式根据任务复杂度决定是否启用；thinking 内容在 UI 中折叠显示 |
| 测试 | `tests/unit/query/thinking.test.ts` |

### 6.5 Fast 模式

| 项目 | 内容 |
|------|------|
| 功能 | 模型特定快速模式 |
| 文件 | 修改 `src/query.ts`、`src/state/AppStateStore.ts` |
| 依赖 | 无 |
| 实现要点 | `/fast` 命令切换；使用更快的模型变体；设置中配置 fast 模式模型 |
| 测试 | `tests/unit/query/fastMode.test.ts` |

---

## 7. Phase 6: 生态集成

**目标:** 建立与外部系统的连接
**前置依赖:** Phase 3（MCP/Plugin 基础）
**验收标准:** MCP 服务器可用，SDK 可用

### 7.1 MCP 服务器模式

| 项目 | 内容 |
|------|------|
| 功能 | 将 mimo-code 暴露为 MCP 服务器 |
| 文件 | 新增 `src/entrypoints/mcp.ts` |
| 依赖 | MCP 完整实现 |
| 实现要点 | stdio 传输；注册所有工具为 MCP 工具；处理 CallTool/ListTools 请求 |

### 7.2 Agent SDK

| 项目 | 内容 |
|------|------|
| 功能 | schemas、控制协议、hooks、sessions |
| 文件 | 新增 `src/entrypoints/sdk/`（5-8 个文件） |
| 依赖 | Hook 系统 |
| 实现要点 | Zod schemas 定义协议；NDJSON stdin/stdout 通信；权限请求/响应协议；session 管理 API |

### 7.3 Session 持久化

| 项目 | 内容 |
|------|------|
| 功能 | 转录记录、session 存储 |
| 文件 | 修改 `src/QueryEngine.ts`，新增 `src/session/` |
| 依赖 | 历史持久化 |
| 实现要点 | 完整对话转录存储；session 恢复；`/resume` 命令；文件历史快照 |

### 7.4 数据迁移

| 项目 | 内容 |
|------|------|
| 功能 | 设置/模型版本迁移 |
| 文件 | 新增 `src/migrations/`（2-3 个文件） |
| 依赖 | 无 |
| 实现要点 | 版本号追踪；迁移脚本注册；自动检测并执行迁移；回滚支持 |

### 7.5 设置同步

| 项目 | 内容 |
|------|------|
| 功能 | 多源设置合并 |
| 文件 | 增强 `src/utils/settings/settings.ts` |
| 依赖 | 无 |
| 实现要点 | user < project < local < managed < flag 优先级；managed 设置从远程拉取；设置变更通知 |

### 7.6 Worktree 管理

| 项目 | 内容 |
|------|------|
| 功能 | git worktree 隔离工作区 |
| 文件 | 新增 `src/worktree/`（2-3 个文件） |
| 依赖 | 无 |
| 实现要点 | 自动创建/销毁 worktree；隔离的 agent 工作区；`/worktree` 命令 |

### 7.7 沙箱系统

| 项目 | 内容 |
|------|------|
| 功能 | 网络/文件系统沙箱 |
| 文件 | 新增 `src/sandbox/`（2-3 个文件） |
| 依赖 | 无 |
| 实现要点 | 网络域名白名单；文件系统写权限控制；沙箱配置 schema |

### 7.8 遥测

| 项目 | 内容 |
|------|------|
| 功能 | OpenTelemetry 指标 |
| 文件 | 新增 `src/telemetry/`（2-3 个文件） |
| 依赖 | 无 |
| 实现要点 | session 计数器；token 计数器；成本计数器；可选禁用 |

### 7.9 策略限制

| 项目 | 内容 |
|------|------|
| 功能 | 远程策略执行 |
| 文件 | 新增 `src/services/policyLimits/` |
| 依赖 | 设置同步 |
| 实现要点 | 最大 token 限制；允许/禁止工具列表；模型限制 |

### 7.10 LSPTool

| 项目 | 内容 |
|------|------|
| 功能 | 语言服务器协议集成 |
| 文件 | 新增 `src/tools/LSPTool/LSPTool.ts`、`src/services/lsp/` |
| 依赖 | 无 |
| 实现要点 | LSP 客户端；符号查找；代码补全；诊断信息；格式化 |

---

## 8. Phase 7: 高级 UI 与工程化

**目标:** 完善 UI 和工程化能力
**前置依赖:** Phase 4（UI 基础）
**验收标准:** 设计系统可用，远程控制可用

### 8.1 设计系统

统一 UI 组件库：Button、Input、Dialog、Table、Card 等基础组件。

### 8.2 更多命令

新增 20+ 命令：`/commit`、`/review`、`/diff`、`/doctor`、`/mcp`、`/skills`、`/tasks`、`/model`、`/theme`、`/usage`、`/cost`、`/resume`、`/share`、`/export`、`/rename`、`/session`、`/permissions`、`/plan`、`/fast`、`/status`

### 8.3 输出样式

可自定义输出格式：markdown、json、text；`/output-style` 命令切换。

### 8.4 协调器模式

多代理编排：coordinator 分配任务给 workers；角色工具过滤；scratchpad 通信。

### 8.5 Voice 模式

语音输入/输出：STT 集成；TTS 集成；`/voice` 命令切换。

### 8.6 Bridge/远程控制

Web 界面控制本地 agent：WebSocket 通信；JWT 认证；session 管理。

### 8.7 远程 sessions

WebSocket 远程会话：RemoteSessionManager；权限转发；SDK 消息适配。

### 8.8 Stop Hooks

轮次后 hook：任务完成 hook；内存提取；自动 dream。

---

## 9. 实现优先级建议

如果资源有限，建议按以下顺序实现：

1. **Phase 1** — 必须做，让工具真正可用
2. **Phase 2 中的 AgentTool + WebSearchTool** — 最高价值的两个工具
3. **Phase 3 中的 Skills + MCP** — 可扩展性的关键
4. **Phase 4 中的快捷键 + diff** — 用户体验的核心改善
5. **Phase 5 中的自动记忆 + 费用追踪** — 智能特性的基础
6. **其余功能** — 按需迭代

---

## 10. 每个阶段的验收标准

| 阶段 | 验收标准 |
|------|---------|
| Phase 1 | `mimo "fix bug"` 可执行；长对话不丢失上下文 |
| Phase 2 | 13 个工具可用；子代理可派生 |
| Phase 3 | 第三方 skill 可加载；MCP 工具可发现 |
| Phase 4 | 快捷键可自定义；diff 带语法高亮 |
| Phase 5 | 自动记忆跨 session 生效；`/cost` 显示费用 |
| Phase 6 | `mimo --mcp-server` 可启动；SDK 可调用 |
| Phase 7 | 20+ 命令可用；远程控制可连接 |
