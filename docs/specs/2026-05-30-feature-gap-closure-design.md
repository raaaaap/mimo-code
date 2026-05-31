# mimo-code 功能补全设计

**日期**: 2026-05-30
**状态**: 已批准
**目标**: 参照 Claude Code 源码，分阶段补全 mimo-code 缺失的核心功能

## 背景

通过对比 mimo-code 与 Claude Code 源码（C:\Users\rap\mimo），发现 mimo-code 缺少约 70% 的功能。本设计聚焦高优先级功能，分 6 个阶段实施。

## 第 1 阶段：Thinking 模式

### 问题
模型无法进行深度推理，复杂任务质量差。

### 设计
- 在 API 请求中传递 `thinking` 参数，启用 extended thinking
- 模型会先输出推理过程（thinking content），再给出最终答案
- 在 UI 中显示推理过程（可折叠）

### 改动文件
- `src/types/api.ts` — ModelRequest 新增 `thinking?: boolean`
- `src/services/api/adapters/openai.ts` — 传递 thinking 参数
- `src/query.ts` — 处理 `thinking` 类型的 stream chunk
- `src/components/Messages/MessageItem.tsx` — 显示推理过程

## 第 2 阶段：ToolSearchTool

### 问题
模型一次性接收所有工具定义，浪费 token 且不知道有哪些工具可用。

### 设计
- 新增 ToolSearchTool，模型可以用关键词搜索可用工具
- 工具定义按需加载，减少初始 prompt 大小

### 改动文件
- 新增 `src/tools/ToolSearchTool/ToolSearchTool.ts`
- 修改 `src/tools.ts` — 注册新工具
- 修改 `src/constants/prompts.ts` — 告知模型可以搜索工具

## 第 3 阶段：PlanMode（计划模式）

### 问题
复杂任务缺乏规划，模型直接执行容易出错。

### 设计
- 新增 EnterPlanModeTool 和 ExitPlanModeTool
- 进入计划模式后，模型只能读取文件，不能写入
- 用户确认计划后，退出计划模式，开始执行
- AppState 新增 `planMode: boolean` 状态

### 改动文件
- 新增 `src/tools/EnterPlanModeTool/EnterPlanModeTool.ts`
- 新增 `src/tools/ExitPlanModeTool/ExitPlanModeTool.ts`
- 修改 `src/state/AppStateStore.ts` — 新增 planMode
- 修改 `src/screens/REPL.tsx` — 计划模式 UI 指示
- 修改 `src/services/permissions/permissions.ts` — 计划模式权限限制

## 第 4 阶段：TaskOutput/TaskStop

### 问题
长时间运行的任务无法管理。

### 设计
- 新增 TaskOutputTool — 获取后台任务输出
- 新增 TaskStopTool — 停止后台任务
- 任务运行器管理后台任务的生命周期

### 改动文件
- 新增 `src/tools/TaskOutputTool/TaskOutputTool.ts`
- 新增 `src/tools/TaskStopTool/TaskStopTool.ts`
- 新增 `src/tasks/runner.ts` — 后台任务运行器
- 修改 `src/tools.ts` — 注册新工具

## 第 5 阶段：SendMessageTool

### 问题
子代理之间无法通信。

### 设计
- 新增 SendMessageTool，子代理可以向父代理或其他子代理发送消息
- 消息通过消息队列传递

### 改动文件
- 新增 `src/tools/SendMessageTool/SendMessageTool.ts`
- 修改 `src/tools/AgentTool/AgentTool.ts` — 支持消息接收
- 新增 `src/services/messageBus.ts` — 消息总线

## 第 6 阶段：上下文窗口管理增强

### 问题
简单的截断策略会丢失重要信息。

### 设计
- 多策略压缩：microcompact, autocompact, collapse
- Token budget 追踪：设置目标 token 使用量
- Context collapse：折叠连续的工具调用序列
- 智能摘要：保留关键信息，压缩冗余内容

### 改动文件
- 重写 `src/services/compact/contextManager.ts`
- 新增 `src/services/compact/tokenBudget.ts`
- 新增 `src/services/compact/contextCollapse.ts`

## 实施顺序

1. Thinking 模式 — 基础能力，影响所有后续功能
2. ToolSearchTool — 减少 token 浪费
3. PlanMode — 提升复杂任务质量
4. TaskOutput/TaskStop — 后台任务管理
5. SendMessageTool — 多代理协作
6. 上下文管理增强 — 长对话质量

## 成功标准

- [ ] 模型可以进行深度推理，thinking 过程可查看
- [ ] 模型可以搜索可用工具
- [ ] 用户可以进入计划模式，先规划再执行
- [ ] 后台任务可以被查看和停止
- [ ] 子代理之间可以通信
- [ ] 长对话不会丢失关键信息
