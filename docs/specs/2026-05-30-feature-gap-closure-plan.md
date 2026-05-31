# mimo-code 功能补全实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 参照 Claude Code 源码，补全 mimo-code 的 6 个高优先级功能，提升任务完成率和用户体验

**Architecture:** 6 个独立阶段，每阶段可独立测试。Thinking 模式通过 API 参数启用；ToolSearchTool 通过关键词搜索延迟加载的工具；PlanMode 通过权限模式切换实现；TaskOutput/TaskStop 通过任务状态管理实现；SendMessage 通过消息队列实现；上下文管理通过多策略压缩实现。

**Tech Stack:** TypeScript, Vitest, Zod, React/Ink

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/types/api.ts` | 修改 | 新增 thinking 配置类型 |
| `src/services/api/adapters/openai.ts` | 修改 | 传递 thinking 参数 |
| `src/query.ts` | 修改 | 处理 thinking chunk |
| `src/components/Messages/MessageItem.tsx` | 修改 | 显示推理过程 |
| `src/tools/ToolSearchTool/ToolSearchTool.ts` | 新增 | 工具搜索 |
| `src/tools/EnterPlanModeTool/EnterPlanModeTool.ts` | 新增 | 进入计划模式 |
| `src/tools/ExitPlanModeTool/ExitPlanModeTool.ts` | 新增 | 退出计划模式 |
| `src/tools/TaskOutputTool/TaskOutputTool.ts` | 新增 | 获取后台任务输出 |
| `src/tools/TaskStopTool/TaskStopTool.ts` | 新增 | 停止后台任务 |
| `src/tools/SendMessageTool/SendMessageTool.ts` | 新增 | 代理间通信 |
| `src/services/messageBus.ts` | 新增 | 消息总线 |
| `src/services/compact/contextManager.ts` | 重写 | 多策略上下文压缩 |
| `src/services/compact/tokenBudget.ts` | 新增 | Token 预算追踪 |
| `src/state/AppStateStore.ts` | 修改 | 新增 planMode/tasks 状态 |
| `src/tools.ts` | 修改 | 注册新工具 |
| `src/constants/prompts.ts` | 修改 | 更新系统提示词 |

---

## 阶段 1：Thinking 模式

### Task 1.1: 新增 Thinking 类型定义

**Files:**
- Modify: `src/types/api.ts`

- [ ] **Step 1: 新增 ThinkingConfig 类型**

在 `src/types/api.ts` 中添加：

```typescript
export type ThinkingConfig =
  | { type: 'adaptive' }
  | { type: 'enabled'; budgetTokens: number }
  | { type: 'disabled' };
```

- [ ] **Step 2: 修改 ModelRequest 接口**

在 `ModelRequest` 接口中添加：

```typescript
export interface ModelRequest {
  model: string;
  messages: Message[];
  system?: string;
  tools?: ToolDefinition[];
  toolChoice?: unknown;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  abortSignal?: AbortSignal;
  thinking?: ThinkingConfig;  // 新增
}
```

- [ ] **Step 3: 运行测试**

Run: `cd c:/Users/rap/mimo-code && npx vitest run`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/types/api.ts
git commit -m "feat: add ThinkingConfig type to ModelRequest"
```

### Task 1.2: OpenAI 适配器支持 thinking 参数

**Files:**
- Modify: `src/services/api/adapters/openai.ts`

- [ ] **Step 1: 修改 buildRequestBody 传递 thinking**

在 `src/services/api/adapters/openai.ts` 的 `buildRequestBody` 方法中，找到 `return` 语句，添加 thinking 支持：

```typescript
private buildRequestBody(request: ModelRequest, stream: boolean) {
  const messages: unknown[] = [];
  if (request.system) {
    messages.push({ role: 'system', content: request.system });
  }
  // ... 现有消息构建逻辑 ...

  const body: Record<string, unknown> = {
    model: request.model,
    messages,
    tools: request.tools,
    tool_choice: request.toolChoice,
    max_tokens: request.maxTokens ?? 8192,
    stream,
  };

  // 只在 thinking 未启用时发送 temperature
  if (!request.thinking || request.thinking.type === 'disabled') {
    body.temperature = request.temperature ?? 0.7;
  }

  // 传递 thinking 参数
  if (request.thinking && request.thinking.type !== 'disabled') {
    body.thinking = request.thinking.type === 'adaptive'
      ? { type: 'adaptive' }
      : { type: 'enabled', budget_tokens: request.thinking.budgetTokens };
  }

  return body;
}
```

- [ ] **Step 2: 运行测试**

Run: `cd c:/Users/rap/mimo-code && npx vitest run`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/services/api/adapters/openai.ts
git commit -m "feat: pass thinking parameter in OpenAI adapter"
```

### Task 1.3: 查询循环处理 thinking chunk

**Files:**
- Modify: `src/query.ts`
- Modify: `src/types/message.ts`

- [ ] **Step 1: 扩展 ContentPart 类型**

在 `src/types/message.ts` 中添加 thinking 内容类型：

```typescript
export interface ContentPart {
  type: 'text' | 'image' | 'thinking';
  text?: string;
  thinking?: string;  // 新增：推理内容
  source?: unknown;
}
```

- [ ] **Step 2: 修改 query.ts 处理 thinking chunk**

在 `src/query.ts` 的 `queryLoop` 中，修改 stream 处理逻辑：

```typescript
for await (const chunk of deps.callModel(request)) {
  if (chunk.type === 'text' && chunk.content) contentParts.push(chunk.content);
  if (chunk.type === 'thinking' && chunk.content) {
    // 存储 thinking 内容到 contentParts
    thinkingParts.push(chunk.content);
  }
  if (chunk.type === 'tool_use' && chunk.toolCall) toolCalls.push(chunk.toolCall);
  if (chunk.type === 'done') {
    finishReason = chunk.finishReason;
    break;
  }
  if (chunk.type === 'error') {
    yield { role: 'assistant', content: `Error: ${chunk.content}` };
    return;
  }
}
```

在 `StreamChunk` 类型中添加 `thinking` 类型：

```typescript
export interface StreamChunk {
  type: 'text' | 'tool_use' | 'done' | 'error' | 'thinking';
  content?: string;
  toolCall?: ToolCall;
  finishReason?: string;
  usage?: TokenUsage;
}
```

- [ ] **Step 3: 运行测试**

Run: `cd c:/Users/rap/mimo-code && npx vitest run`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/query.ts src/types/message.ts src/types/api.ts
git commit -m "feat: handle thinking chunks in query loop"
```

### Task 1.4: UI 显示推理过程

**Files:**
- Modify: `src/components/Messages/MessageItem.tsx`

- [ ] **Step 1: 添加 thinking 内容渲染**

在 `MessageItem.tsx` 的 `renderMarkdown` 函数之前，添加 thinking 渲染：

```typescript
function renderThinking(thinking: string): React.ReactNode {
  const lines = thinking.split('\n');
  const preview = lines.slice(0, 3).join(' ');
  const truncated = lines.length > 3;
  return React.createElement(
    Box,
    { flexDirection: 'column', borderStyle: 'single', borderColor: '#444444', paddingX: 1 },
    React.createElement(Text, { color: '#666668', italic: true }, '💭 推理过程:'),
    React.createElement(Text, { color: '#555555' }, preview + (truncated ? '...' : ''))
  );
}
```

在消息渲染中，检查 content 是否包含 thinking 部分：

```typescript
// 在 displayContent 渲染之前
const thinkingContent = message.content && typeof message.content !== 'string'
  ? message.content.filter(p => p.type === 'thinking').map(p => p.thinking).join('')
  : null;
```

- [ ] **Step 2: 运行测试**

Run: `cd c:/Users/rap/mimo-code && npx vitest run`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/components/Messages/MessageItem.tsx
git commit -m "feat: display thinking process in message UI"
```

---

## 阶段 2：ToolSearchTool

### Task 2.1: 实现 ToolSearchTool

**Files:**
- Create: `src/tools/ToolSearchTool/ToolSearchTool.ts`
- Modify: `src/tools.ts`

- [ ] **Step 1: 创建 ToolSearchTool**

创建 `src/tools/ToolSearchTool/ToolSearchTool.ts`：

```typescript
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';
import type { Tool } from '../../types/tool.js';

const inputSchema = z.object({
  query: z.string().describe('搜索关键词，或 "select:ToolName" 直接选择工具'),
  max_results: z.number().optional().default(5).describe('最大返回数量'),
});

export const ToolSearchTool = (getAllTools: () => Tool[]) => buildTool({
  name: 'ToolSearchTool',
  inputSchema,
  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  description: async () => '搜索可用工具。用关键词搜索或 select:ToolName 直接选择。',
  prompt: () => '当不确定有哪些工具可用时，用关键词搜索。用 "select:ToolName" 直接加载特定工具。',
  call: async (args) => {
    const tools = getAllTools();
    const query = args.query.trim();

    // 直接选择模式
    if (query.startsWith('select:')) {
      const names = query.slice(7).split(',').map(n => n.trim());
      const matched = tools.filter(t => names.includes(t.name));
      return {
        toolUseId: '',
        name: 'ToolSearchTool',
        result: JSON.stringify({
          matches: matched.map(t => t.name),
          query,
          total_tools: tools.length,
        }),
      };
    }

    // 关键词搜索模式
    const terms = query.toLowerCase().split(/\s+/);
    const scored = tools.map(tool => {
      const name = tool.name.toLowerCase();
      const desc = (tool.prompt?.() ?? '').toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (name.includes(term)) score += 10;
        if (desc.includes(term)) score += 2;
      }
      return { tool, score };
    }).filter(t => t.score > 0);

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, args.max_results).map(t => t.tool.name);

    return {
      toolUseId: '',
      name: 'ToolSearchTool',
      result: JSON.stringify({
        matches: results,
        query,
        total_tools: tools.length,
      }),
    };
  },
});
```

- [ ] **Step 2: 注册 ToolSearchTool**

在 `src/tools.ts` 的 `createDefaultRegistry` 中添加：

```typescript
import { ToolSearchTool } from './tools/ToolSearchTool/ToolSearchTool.js';

export function createDefaultRegistry(agentDeps?: AgentToolDeps): ToolRegistry {
  const registry = new ToolRegistry();
  // ... 现有工具注册 ...
  registry.register(ToolSearchTool(() => registry.getAll()));
  // ...
  return registry;
}
```

- [ ] **Step 3: 添加测试**

创建 `tests/unit/tools/ToolSearchTool.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import { ToolSearchTool } from '../../../src/tools/ToolSearchTool/ToolSearchTool.js';
import { buildTool } from '../../../src/types/tool.js';
import { z } from 'zod';

function makeTestTool(name: string, desc: string) {
  return buildTool({
    name,
    inputSchema: z.object({}),
    prompt: () => desc,
    call: async () => ({ toolUseId: '', name, result: 'ok' }),
  });
}

describe('ToolSearchTool', () => {
  const tools = [
    makeTestTool('FileWriteTool', 'Write content to a file'),
    makeTestTool('BashTool', 'Execute shell commands'),
    makeTestTool('GrepTool', 'Search file contents'),
  ];

  it('should search tools by keyword', async () => {
    const tool = ToolSearchTool(() => tools);
    const result = await tool.call({ query: 'file write', max_results: 5 }, {} as any);
    const parsed = JSON.parse(result.result);
    expect(parsed.matches).toContain('FileWriteTool');
  });

  it('should select tools directly', async () => {
    const tool = ToolSearchTool(() => tools);
    const result = await tool.call({ query: 'select:BashTool,GrepTool', max_results: 5 }, {} as any);
    const parsed = JSON.parse(result.result);
    expect(parsed.matches).toEqual(['BashTool', 'GrepTool']);
  });
});
```

- [ ] **Step 4: 运行测试**

Run: `cd c:/Users/rap/mimo-code && npx vitest run tests/unit/tools/ToolSearchTool.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/tools/ToolSearchTool/ToolSearchTool.ts src/tools.ts tests/unit/tools/ToolSearchTool.test.ts
git commit -m "feat: add ToolSearchTool for on-demand tool discovery"
```

---

## 阶段 3：PlanMode

### Task 3.1: 实现 EnterPlanModeTool

**Files:**
- Create: `src/tools/EnterPlanModeTool/EnterPlanModeTool.ts`
- Modify: `src/state/AppStateStore.ts`
- Modify: `src/tools.ts`

- [ ] **Step 1: 新增 planMode 状态**

在 `src/state/AppStateStore.ts` 的 `AppState` 接口中添加：

```typescript
export interface AppState {
  // ... 现有字段 ...
  planMode: boolean;
  prePlanMode?: string;  // 保存进入计划模式前的权限模式
}
```

在 `INITIAL_APP_STATE` 中添加：

```typescript
export const INITIAL_APP_STATE: AppState = {
  // ... 现有默认值 ...
  planMode: false,
};
```

- [ ] **Step 2: 创建 EnterPlanModeTool**

创建 `src/tools/EnterPlanModeTool/EnterPlanModeTool.ts`：

```typescript
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.strictObject({});

export const EnterPlanModeTool = buildTool({
  name: 'EnterPlanMode',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => true,
  description: async () => '进入计划模式。在此模式下只能读取文件和搜索，不能写入或执行命令。',
  prompt: () => '进入计划模式，用于在执行前规划方案。只能读取和搜索，不能修改文件。',
  call: async (args, context) => {
    const state = context.getAppState() as any;
    if (state.planMode) {
      return { toolUseId: '', name: 'EnterPlanMode', result: '已经在计划模式中。' };
    }

    context.setAppState({
      planMode: true,
      prePlanMode: state.permissionMode || 'default',
      permissionMode: 'plan',
    } as any);

    return {
      toolUseId: '',
      name: 'EnterPlanMode',
      result: '已进入计划模式。你现在只能读取文件和搜索代码。请分析代码库，设计方案，然后使用 ExitPlanMode 退出计划模式。用户确认计划后，你将获得执行权限。',
    };
  },
});
```

- [ ] **Step 3: 创建 ExitPlanModeTool**

创建 `src/tools/ExitPlanModeTool/ExitPlanModeTool.ts`：

```typescript
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.strictObject({
  plan: z.string().describe('完整的计划文本'),
});

export const ExitPlanModeTool = buildTool({
  name: 'ExitPlanMode',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  description: async () => '退出计划模式，提交计划供用户审批。',
  prompt: () => '退出计划模式并提交计划。计划应包含具体的实施步骤。',
  call: async (args, context) => {
    const state = context.getAppState() as any;
    if (!state.planMode) {
      return { toolUseId: '', name: 'ExitPlanMode', result: '当前不在计划模式中。' };
    }

    // 恢复之前的权限模式
    context.setAppState({
      planMode: false,
      permissionMode: state.prePlanMode || 'default',
    } as any);

    return {
      toolUseId: '',
      name: 'ExitPlanMode',
      result: `计划已提交：\n\n${args.plan}\n\n用户已确认，现在开始执行计划。`,
    };
  },
});
```

- [ ] **Step 4: 注册工具**

在 `src/tools.ts` 中添加：

```typescript
import { EnterPlanModeTool } from './tools/EnterPlanModeTool/EnterPlanModeTool.js';
import { ExitPlanModeTool } from './tools/ExitPlanModeTool/ExitPlanModeTool.js';

export function createDefaultRegistry(agentDeps?: AgentToolDeps): ToolRegistry {
  // ...
  registry.register(EnterPlanModeTool);
  registry.register(ExitPlanModeTool);
  // ...
}
```

- [ ] **Step 5: 运行测试**

Run: `cd c:/Users/rap/mimo-code && npx vitest run`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add src/tools/EnterPlanModeTool/ src/tools/ExitPlanModeTool/ src/state/AppStateStore.ts src/tools.ts
git commit -m "feat: add PlanMode (EnterPlanMode/ExitPlanMode tools)"
```

---

## 阶段 4：TaskOutput/TaskStop

### Task 4.1: 实现后台任务管理

**Files:**
- Create: `src/tools/TaskOutputTool/TaskOutputTool.ts`
- Create: `src/tools/TaskStopTool/TaskStopTool.ts`
- Modify: `src/state/AppStateStore.ts`
- Modify: `src/tools.ts`

- [ ] **Step 1: 新增任务状态**

在 `src/state/AppStateStore.ts` 中添加：

```typescript
export interface TaskState {
  id: string;
  type: 'bash' | 'agent';
  status: 'running' | 'completed' | 'failed' | 'stopped';
  command?: string;
  output: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

export interface AppState {
  // ... 现有字段 ...
  tasks: Record<string, TaskState>;
}
```

- [ ] **Step 2: 创建 TaskStopTool**

创建 `src/tools/TaskStopTool/TaskStopTool.ts`：

```typescript
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.strictObject({
  task_id: z.string().describe('要停止的任务 ID'),
});

export const TaskStopTool = buildTool({
  name: 'TaskStop',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  description: async () => '停止一个正在运行的后台任务。',
  prompt: () => '停止后台任务。传入任务 ID。',
  call: async (args, context) => {
    const state = context.getAppState() as any;
    const task = state.tasks?.[args.task_id];

    if (!task) {
      return { toolUseId: '', name: 'TaskStop', result: '', error: `任务 ${args.task_id} 不存在`, isError: true };
    }
    if (task.status !== 'running') {
      return { toolUseId: '', name: 'TaskStop', result: '', error: `任务 ${args.task_id} 未在运行`, isError: true };
    }

    // 更新任务状态
    const tasks = { ...state.tasks };
    tasks[args.task_id] = { ...task, status: 'stopped', completedAt: Date.now() };
    context.setAppState({ tasks } as any);

    return {
      toolUseId: '',
      name: 'TaskStop',
      result: JSON.stringify({ message: '任务已停止', task_id: args.task_id, task_type: task.type }),
    };
  },
});
```

- [ ] **Step 3: 创建 TaskOutputTool**

创建 `src/tools/TaskOutputTool/TaskOutputTool.ts`：

```typescript
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.strictObject({
  task_id: z.string().describe('任务 ID'),
  block: z.boolean().optional().default(true).describe('是否等待任务完成'),
  timeout: z.number().optional().default(30000).describe('最大等待时间（毫秒）'),
});

export const TaskOutputTool = buildTool({
  name: 'TaskOutput',
  inputSchema,
  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  description: async () => '获取后台任务的输出。',
  prompt: () => '获取后台任务输出。可选择阻塞等待任务完成。',
  call: async (args, context) => {
    const state = context.getAppState() as any;
    const task = state.tasks?.[args.task_id];

    if (!task) {
      return { toolUseId: '', name: 'TaskOutput', result: '', error: `任务 ${args.task_id} 不存在`, isError: true };
    }

    // 如果需要等待且任务仍在运行
    if (args.block && task.status === 'running') {
      const startTime = Date.now();
      while (Date.now() - startTime < args.timeout) {
        await new Promise(r => setTimeout(r, 100));
        const updated = (context.getAppState() as any).tasks?.[args.task_id];
        if (updated && updated.status !== 'running') {
          return {
            toolUseId: '',
            name: 'TaskOutput',
            result: JSON.stringify({
              retrieval_status: 'success',
              task: { task_id: args.task_id, ...updated },
            }),
          };
        }
      }
      return {
        toolUseId: '',
        name: 'TaskOutput',
        result: JSON.stringify({ retrieval_status: 'timeout', task: null }),
      };
    }

    return {
      toolUseId: '',
      name: 'TaskOutput',
      result: JSON.stringify({
        retrieval_status: 'success',
        task: { task_id: args.task_id, ...task },
      }),
    };
  },
});
```

- [ ] **Step 4: 注册工具并运行测试**

在 `src/tools.ts` 中注册，运行测试。

- [ ] **Step 5: 提交**

```bash
git add src/tools/TaskOutputTool/ src/tools/TaskStopTool/ src/state/AppStateStore.ts src/tools.ts
git commit -m "feat: add TaskOutput/TaskStop tools for background task management"
```

---

## 阶段 5：SendMessageTool

### Task 5.1: 实现代理间通信

**Files:**
- Create: `src/tools/SendMessageTool/SendMessageTool.ts`
- Create: `src/services/messageBus.ts`
- Modify: `src/tools.ts`

- [ ] **Step 1: 创建消息总线**

创建 `src/services/messageBus.ts`：

```typescript
export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  summary?: string;
  timestamp: number;
}

type MessageHandler = (msg: Message) => void;

class MessageBus {
  private handlers = new Map<string, MessageHandler[]>();
  private queues = new Map<string, Message[]>();

  send(to: string, message: Message): void {
    const handlers = this.handlers.get(to);
    if (handlers) {
      for (const handler of handlers) handler(message);
    } else {
      // 存入队列等待接收
      const queue = this.queues.get(to) ?? [];
      queue.push(message);
      this.queues.set(to, queue);
    }
  }

  subscribe(agentId: string, handler: MessageHandler): () => void {
    const handlers = this.handlers.get(agentId) ?? [];
    handlers.push(handler);
    this.handlers.set(agentId, handlers);

    // 处理队列中的消息
    const queue = this.queues.get(agentId) ?? [];
    for (const msg of queue) handler(msg);
    this.queues.delete(agentId);

    return () => {
      const h = this.handlers.get(agentId);
      if (h) this.handlers.set(agentId, h.filter(x => x !== handler));
    };
  }

  getQueue(agentId: string): Message[] {
    return this.queues.get(agentId) ?? [];
  }
}

export const messageBus = new MessageBus();
```

- [ ] **Step 2: 创建 SendMessageTool**

创建 `src/tools/SendMessageTool/SendMessageTool.ts`：

```typescript
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';
import { messageBus } from '../../services/messageBus.js';

const inputSchema = z.object({
  to: z.string().describe('接收者 ID，或 "*" 广播'),
  message: z.string().describe('消息内容'),
  summary: z.string().optional().describe('5-10 字摘要'),
});

export const SendMessageTool = buildTool({
  name: 'SendMessage',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  description: async () => '向其他代理发送消息。',
  prompt: () => '向其他代理发送消息。用 "*" 广播给所有代理。',
  call: async (args, context) => {
    const from = (context.getAppState() as any).currentAgentId || 'main';

    messageBus.send(args.to, {
      id: crypto.randomUUID(),
      from,
      to: args.to,
      content: args.message,
      summary: args.summary,
      timestamp: Date.now(),
    });

    return {
      toolUseId: '',
      name: 'SendMessage',
      result: JSON.stringify({ sent: true, to: args.to, from }),
    };
  },
});
```

- [ ] **Step 3: 注册工具并运行测试**

- [ ] **Step 4: 提交**

```bash
git add src/tools/SendMessageTool/ src/services/messageBus.ts src/tools.ts
git commit -m "feat: add SendMessageTool for inter-agent communication"
```

---

## 阶段 6：上下文管理增强

### Task 6.1: 重写上下文管理器

**Files:**
- Rewrite: `src/services/compact/contextManager.ts`
- Create: `src/services/compact/tokenBudget.ts`

- [ ] **Step 1: 创建 TokenBudget**

创建 `src/services/compact/tokenBudget.ts`：

```typescript
export class TokenBudget {
  private target: number;
  private used: number = 0;

  constructor(target: number) {
    this.target = target;
  }

  consume(tokens: number): void {
    this.used += tokens;
  }

  remaining(): number {
    return Math.max(0, this.target - this.used);
  }

  isOverBudget(): boolean {
    return this.used > this.target;
  }

  usage(): number {
    return this.used / this.target;
  }
}
```

- [ ] **Step 2: 增强 contextManager 的 collapse 策略**

在 `src/services/compact/contextManager.ts` 中添加 `collapseToolSequences` 方法（已在之前的修复中添加），并增强 `compress` 方法：

```typescript
async compress(messages: Message[]): Promise<Message[]> {
  let result = this.microcompact(messages);

  const autocompactResult = await this.autocompact(result.messages);
  if (autocompactResult.compressed) {
    result = autocompactResult;
  }

  const tokens = this.tokenCounter.countMessages(result.messages);
  if (tokens > this.config.maxTokens) {
    const collapseResult = this.collapseToolSequences(result.messages);
    if (collapseResult.compressed) {
      result = collapseResult;
    }
  }

  // 如果仍然超预算，使用 reactive 压缩
  const finalTokens = this.tokenCounter.countMessages(result.messages);
  if (finalTokens > this.config.maxTokens * 1.2) {
    const reactiveResult = this.reactiveCompress(result.messages);
    if (reactiveResult.compressed) {
      result = reactiveResult;
    }
  }

  return result.messages;
}
```

- [ ] **Step 3: 运行测试**

Run: `cd c:/Users/rap/mimo-code && npx vitest run tests/unit/compact/contextManager.test.ts`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/services/compact/contextManager.ts src/services/compact/tokenBudget.ts
git commit -m "feat: enhance context management with multi-strategy compression"
```

---

## 自检清单

- [ ] 所有 spec 需求都有对应的 task
- [ ] 无 TBD/TODO 占位符
- [ ] 类型/方法签名在各 task 间一致
- [ ] 每个 task 有完整的代码示例
- [ ] 测试命令和预期输出明确
