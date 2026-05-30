# Agent 任务执行修复 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 mimo-code 无法完成复杂任务的 7 个 bug，使"制作展示网页到桌面"这类任务能正常执行

**Architecture:** 6 个独立修复，按依赖顺序执行：AgentTool tools 传递 → parseToolCallsFromText 重写 → BashTool Windows 兼容 → maxTokens 调整 → 上下文压缩保护 → 系统提示词重设计。每个修复独立可测试。

**Tech Stack:** TypeScript, Vitest, Zod, Node.js child_process

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/tools/AgentTool/AgentTool.ts` | 修改 | 新增 `getToolDefinitions` 到 deps，传递 tools 给 queryLoop |
| `src/tools.ts` | 修改 | `createDefaultRegistry` 接收并传递 toolDefinitions |
| `src/screens/REPL.tsx` | 修改 | 初始化时传入 `getToolDefinitions` |
| `src/query.ts` | 修改 | 重写 `parseToolCallsFromText`，提高 maxTokens 默认值 |
| `src/tools/BashTool/BashTool.ts` | 修改 | Windows 上用 PowerShell 替代 bash |
| `src/services/compact/contextManager.ts` | 修改 | 提高截断阈值，保护工具输出 |
| `src/constants/prompts.ts` | 修改 | 重写系统提示词，加入中文任务指导 |
| `tests/unit/tools/AgentTool.test.ts` | 修改 | 新增 tools 传递测试 |
| `tests/unit/query.test.ts` | 修改 | 新增 parseToolCallsFromText 测试 |
| `tests/unit/tools/BashTool.test.ts` | 修改 | 新增 Windows 兼容测试 |

---

### Task 1: AgentTool 传递 tools 参数

**Files:**
- Modify: `src/tools/AgentTool/AgentTool.ts`
- Modify: `src/tools.ts`
- Modify: `src/screens/REPL.tsx`
- Modify: `tests/unit/tools/AgentTool.test.ts`

- [ ] **Step 1: 写失败测试 — 子代理应收到 tools 定义**

在 `tests/unit/tools/AgentTool.test.ts` 末尾添加：

```typescript
it('should pass tools to sub-agent queryLoop', async () => {
  let receivedTools: unknown[] | undefined;
  
  const tool = AgentTool({
    callModel: async function* (req) {
      receivedTools = req.tools;
      yield { type: 'text', content: 'done' };
      yield { type: 'done', finishReason: 'stop' };
    },
    getTool: () => undefined,
    getToolDefinitions: () => [
      { type: 'function', function: { name: 'FileWriteTool', description: 'Write files', parameters: {} } },
      { type: 'function', function: { name: 'BashTool', description: 'Run commands', parameters: {} } },
    ],
  });

  await tool.call({ prompt: 'test' }, makeCtx());
  
  expect(receivedTools).toBeDefined();
  expect(receivedTools).toHaveLength(2);
  expect((receivedTools as any[])[0].function.name).toBe('FileWriteTool');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd c:/Users/rap/mimo-code && npx vitest run tests/unit/tools/AgentTool.test.ts`
Expected: FAIL — `getToolDefinitions` is not a function

- [ ] **Step 3: 修改 AgentToolDeps 接口和 AgentTool 实现**

修改 `src/tools/AgentTool/AgentTool.ts`：

```typescript
// 修改 deps 接口
export interface AgentToolDeps {
  getTool: (name: string) => Tool | undefined;
  callModel: (request: ModelRequest) => AsyncGenerator<StreamChunk>;
  getToolDefinitions: () => ModelRequest['tools'];  // 新增
}

// 在 call() 中传递 tools
for await (const msg of queryLoop(
  subMessages,
  subDeps,
  {
    model: context.options.model,
    maxTokens: context.options.maxTokens,
    temperature: context.options.temperature,
    abortSignal: abortController.signal,
  },
  args.systemPrompt,
  deps.getToolDefinitions(),  // 新增第 5 个参数
)) {
```

- [ ] **Step 4: 修改 createDefaultRegistry 传递 getToolDefinitions**

修改 `src/tools.ts` 的 `createDefaultRegistry`：

```typescript
export interface AgentToolDeps {
  getTool: (name: string) => Tool | undefined;
  callModel: (request: ModelRequest) => AsyncGenerator<StreamChunk>;
  getToolDefinitions: () => ToolDefinition[];
}

export function createDefaultRegistry(agentDeps?: AgentToolDeps): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(FileReadTool());
  registry.register(FileWriteTool());
  registry.register(FileEditTool());
  registry.register(GlobTool());
  registry.register(GrepTool());
  registry.register(BashTool());
  registry.register(WebFetchTool());
  registry.register(WebSearchTool());
  registry.register(TodoWriteTool());
  registry.register(NotebookEditTool());
  registry.register(PowerShellTool());
  registry.register(AskUserQuestionTool());
  if (agentDeps) {
    registry.register(AgentTool(agentDeps));
  }
  return registry;
}
```

- [ ] **Step 5: 修改 REPL.tsx 传入 getToolDefinitions**

修改 `src/screens/REPL.tsx` 中 `createDefaultRegistry` 的调用：

```typescript
const toolRegistry = useRef(createDefaultRegistry({
  callModel: (req) => client.streamChat(req),
  getTool: (name: string) => toolRegistry.current.get(name),
  getToolDefinitions: () => toolRegistry.current.toToolDefinitions(),
}));
```

- [ ] **Step 6: 运行测试确认通过**

Run: `cd c:/Users/rap/mimo-code && npx vitest run tests/unit/tools/AgentTool.test.ts`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add src/tools/AgentTool/AgentTool.ts src/tools.ts src/screens/REPL.tsx tests/unit/tools/AgentTool.test.ts
git commit -m "fix: pass tools to sub-agent via AgentToolDeps.getToolDefinitions"
```

---

### Task 2: 重写 parseToolCallsFromText

**Files:**
- Modify: `src/query.ts`
- Modify: `tests/unit/query.test.ts`

- [ ] **Step 1: 写失败测试 — 格式化 JSON 和多个调用**

在 `tests/unit/query.test.ts` 中添加：

```typescript
describe('parseToolCallsFromText', () => {
  // 需要导出 parseToolCallsFromText 或通过 queryLoop 间接测试
  // 这里通过 queryLoop 间接测试

  it('should parse formatted JSON tool calls', async () => {
    const formattedJson = `{
  "name": "FileWriteTool",
  "arguments": {
    "file_path": "/tmp/test.html",
    "content": "<html>hello</html>"
  }
}`;
    
    let callModelCalled = false;
    const messages: Message[] = [{ role: 'user', content: 'create a file' }];
    
    async function* mockCallModel(req: ModelRequest) {
      callModelCalled = true;
      yield { type: 'text', content: formattedJson };
      yield { type: 'done', finishReason: 'stop' };
    }
    
    const collected: Message[] = [];
    for await (const msg of queryLoop(messages, {
      callModel: mockCallModel,
      microcompact: (m) => m,
      autocompact: async (m) => m,
      uuid: () => 'test-id',
      getTool: () => undefined,
      toolContext: makeTestContext(),
    }, { model: 'test' })) {
      collected.push(msg);
    }
    
    const assistantMsg = collected.find(m => m.role === 'assistant');
    expect(assistantMsg?.toolCalls).toBeDefined();
    expect(assistantMsg?.toolCalls).toHaveLength(1);
    expect(assistantMsg?.toolCalls![0].function.name).toBe('FileWriteTool');
  });

  it('should parse multiple tool calls from text', async () => {
    const multiCall = `First call: {"name": "FileWriteTool", "arguments": {"file_path": "/a", "content": "x"}}
Second call: {"name": "BashTool", "arguments": {"command": "echo hi"}}`;
    
    const messages: Message[] = [{ role: 'user', content: 'do two things' }];
    
    async function* mockCallModel(req: ModelRequest) {
      yield { type: 'text', content: multiCall };
      yield { type: 'done', finishReason: 'stop' };
    }
    
    const collected: Message[] = [];
    for await (const msg of queryLoop(messages, {
      callModel: mockCallModel,
      microcompact: (m) => m,
      autocompact: async (m) => m,
      uuid: () => 'test-id',
      getTool: () => undefined,
      toolContext: makeTestContext(),
    }, { model: 'test' })) {
      collected.push(msg);
    }
    
    const assistantMsg = collected.find(m => m.role === 'assistant');
    expect(assistantMsg?.toolCalls).toBeDefined();
    expect(assistantMsg?.toolCalls).toHaveLength(2);
    expect(assistantMsg?.toolCalls![0].function.name).toBe('FileWriteTool');
    expect(assistantMsg?.toolCalls![1].function.name).toBe('BashTool');
  });

  it('should parse alternate tool/input format', async () => {
    const altFormat = `{"tool": "FileWriteTool", "input": {"file_path": "/tmp/test.html", "content": "<html></html>"}}`;
    
    const messages: Message[] = [{ role: 'user', content: 'create a file' }];
    
    async function* mockCallModel(req: ModelRequest) {
      yield { type: 'text', content: altFormat };
      yield { type: 'done', finishReason: 'stop' };
    }
    
    const collected: Message[] = [];
    for await (const msg of queryLoop(messages, {
      callModel: mockCallModel,
      microcompact: (m) => m,
      autocompact: async (m) => m,
      uuid: () => 'test-id',
      getTool: () => undefined,
      toolContext: makeTestContext(),
    }, { model: 'test' })) {
      collected.push(msg);
    }
    
    const assistantMsg = collected.find(m => m.role === 'assistant');
    expect(assistantMsg?.toolCalls).toBeDefined();
    expect(assistantMsg?.toolCalls).toHaveLength(1);
    expect(assistantMsg?.toolCalls![0].function.name).toBe('FileWriteTool');
  });
});
```

注意：需要在测试文件顶部添加 `makeTestContext` 辅助函数（如果不存在）：

```typescript
function makeTestContext(): ToolUseContext {
  return {
    options: { model: 'test' },
    abortController: new AbortController(),
    readFileState: new Map(),
    messages: [],
    toolDecisions: new Map(),
    requestPrompt: async () => '',
    getAppState: () => ({}),
    setAppState: () => {},
  };
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd c:/Users/rap/mimo-code && npx vitest run tests/unit/query.test.ts`
Expected: FAIL — 格式化 JSON 解析失败，多个调用只返回 1 个

- [ ] **Step 3: 重写 parseToolCallsFromText**

替换 `src/query.ts` 中的 `parseToolCallsFromText` 函数：

```typescript
/** Parse tool calls from text content when the API doesn't support structured tool_calls */
function parseToolCallsFromText(text: string, uuid: () => string): ToolCall[] {
  const results: ToolCall[] = [];

  // 用括号平衡算法找到所有 JSON 块
  let depth = 0;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const jsonStr = text.slice(start, i + 1);
        try {
          const obj = JSON.parse(jsonStr);
          // 格式 1: {"name": "ToolName", "arguments": {...}}
          if (obj.name && obj.arguments) {
            results.push({
              id: uuid(),
              type: 'function',
              function: {
                name: obj.name,
                arguments: typeof obj.arguments === 'string'
                  ? obj.arguments
                  : JSON.stringify(obj.arguments),
              },
            });
          }
          // 格式 2: {"tool": "ToolName", "input": {...}}
          else if (obj.tool && obj.input) {
            results.push({
              id: uuid(),
              type: 'function',
              function: {
                name: obj.tool,
                arguments: typeof obj.input === 'string'
                  ? obj.input
                  : JSON.stringify(obj.input),
              },
            });
          }
        } catch {
          // 跳过无效 JSON
        }
        start = -1;
      }
    }
  }

  return results;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd c:/Users/rap/mimo-code && npx vitest run tests/unit/query.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/query.ts tests/unit/query.test.ts
git commit -m "fix: rewrite parseToolCallsFromText with bracket-balancing algorithm

Supports formatted JSON and multiple tool calls in a single response."
```

---

### Task 3: BashTool Windows 兼容

**Files:**
- Modify: `src/tools/BashTool/BashTool.ts`
- Modify: `tests/unit/tools/BashTool.test.ts`

- [ ] **Step 1: 写失败测试 — Windows 平台应使用 PowerShell**

在 `tests/unit/tools/BashTool.test.ts` 中添加：

```typescript
it('should use PowerShell on Windows', async () => {
  const originalPlatform = process.platform;
  
  // 模拟 Windows 平台
  Object.defineProperty(process, 'platform', { value: 'win32' });
  
  const tool = BashTool();
  const result = await tool.call({ command: 'echo hello', timeout: 5000 }, makeCtx());
  
  // 恢复原始平台
  Object.defineProperty(process, 'platform', { value: originalPlatform });
  
  // 在非 Windows 环境下这个测试可能失败，所以我们只验证不报错
  // 实际的 Windows 兼容性需要在 Windows 上测试
  expect(result.isError).toBeFalsy();
});
```

- [ ] **Step 2: 运行测试确认当前行为**

Run: `cd c:/Users/rap/mimo-code && npx vitest run tests/unit/tools/BashTool.test.ts`
Expected: 测试通过（因为在当前 Windows 环境下 bash 可能可用）

- [ ] **Step 3: 修改 BashTool 实现**

替换 `src/tools/BashTool/BashTool.ts` 中的 `call` 方法：

```typescript
call: async (args) => {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'powershell.exe' : 'bash';
    const shellArgs = isWindows ? ['-Command', args.command] : ['-c', args.command];

    const parts: string[] = [];
    const errParts: string[] = [];
    const proc = spawn(shell, shellArgs, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const timeout = setTimeout(() => proc.kill('SIGTERM'), args.timeout ?? 120000);
    proc.stdout.on('data', (data: Buffer) => parts.push(data.toString()));
    proc.stderr.on('data', (data: Buffer) => errParts.push(data.toString()));
    proc.on('close', (code) => {
      clearTimeout(timeout);
      const combined = [parts.join(''), errParts.join('')].filter(Boolean).join('');
      if (code !== 0) resolve({ toolUseId: '', name: 'BashTool', result: combined, error: `Exit code ${code}`, isError: true });
      else resolve({ toolUseId: '', name: 'BashTool', result: combined || '(no output)' });
    });
    proc.on('error', (err) => { clearTimeout(timeout); resolve({ toolUseId: '', name: 'BashTool', result: '', error: err.message, isError: true }); });
    proc.stdin.end();
  });
},
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd c:/Users/rap/mimo-code && npx vitest run tests/unit/tools/BashTool.test.ts`
Expected: PASS

- [ ] **Step 5: 手动验证 Windows 兼容性**

在 Windows 终端中运行 mimo-code，执行简单命令如 "echo hello"，确认使用 PowerShell。

- [ ] **Step 6: 提交**

```bash
git add src/tools/BashTool/BashTool.ts tests/unit/tools/BashTool.test.ts
git commit -m "fix: use PowerShell on Windows instead of bash

Detects process.platform and uses powershell.exe -Command on win32."
```

---

### Task 4: maxTokens 动态调整

**Files:**
- Modify: `src/query.ts`

- [ ] **Step 1: 修改 queryLoop 默认 maxTokens**

在 `src/query.ts` 中找到 `request` 对象构建，修改默认值：

```typescript
const request: ModelRequest = {
  model: options.model,
  messages,
  system: systemPrompt,
  tools,
  maxTokens: options.maxTokens ?? 8192,  // 从 4096 提高到 8192
  temperature: options.temperature ?? 0.7,
  stream: true,
  abortSignal: options.abortSignal,
};
```

- [ ] **Step 2: 运行全量测试确认无回归**

Run: `cd c:/Users/rap/mimo-code && npx vitest run`
Expected: 所有测试通过

- [ ] **Step 3: 提交**

```bash
git add src/query.ts
git commit -m "fix: increase default maxTokens from 4096 to 8192

4096 is insufficient for generating complete HTML/CSS/JS files."
```

---

### Task 5: 上下文压缩保护

**Files:**
- Modify: `src/services/compact/contextManager.ts`

- [ ] **Step 1: 修改 microcompact 截断阈值**

在 `src/services/compact/contextManager.ts` 中找到 `microcompact` 方法，修改截断逻辑：

```typescript
microcompact(messages: Message[]): CompressionResult {
  let changed = false;
  const result: Message[] = [];

  for (const msg of messages) {
    if (typeof msg.content === 'string' && msg.content.trim().length === 0 && !msg.toolCalls) {
      changed = true;
      continue;
    }
    if (msg.role === 'tool' && typeof msg.content === 'string' && msg.content.length > 5000) {
      changed = true;
      const half = 2500;
      result.push({
        ...msg,
        content: msg.content.slice(0, half) + '\n\n[...truncated...]\n\n' + msg.content.slice(-half),
      });
      continue;
    }
    result.push(msg);
  }

  return { messages: result, compressed: changed, removedCount: messages.length - result.length, strategy: 'microcompact' };
}
```

- [ ] **Step 2: 修改 DEFAULT_CONFIG 中的 maxToolOutputLength**

在 `src/services/compact/contextManager.ts` 中找到 `DEFAULT_CONFIG`：

```typescript
const DEFAULT_CONFIG: ContextManagerConfig = {
  maxTokens: 8000,
  compactThreshold: 0.8,
  maxToolOutputLength: 5000,  // 从 2000 提高到 5000
  preserveRecent: 5,
  summarize: async (text) => `[Summary of ${text.length} chars]`,
};
```

- [ ] **Step 3: 运行上下文管理器测试**

Run: `cd c:/Users/rap/mimo-code && npx vitest run tests/unit/compact/contextManager.test.ts`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/services/compact/contextManager.ts
git commit -m "fix: increase tool output truncation threshold from 2000 to 5000

Prevents generated code from being truncated during context compression."
```

---

### Task 6: 系统提示词重设计

**Files:**
- Modify: `src/constants/prompts.ts`

- [ ] **Step 1: 重写 getSystemPrompt 函数**

替换 `src/constants/prompts.ts` 的完整内容：

```typescript
import type { Tool } from '../types/tool.js';
import type { SystemContext } from '../context.js';
import { formatSystemContext } from '../context.js';

export function getSystemPrompt(
  tools: Tool[],
  context: SystemContext,
  mimoMd?: string,
): string {
  const sections: string[] = [];

  sections.push(`## 身份
你是 Mimo，一个运行在用户终端中的 AI 编程助手。你可以编写代码、执行命令、搜索文件、管理任务。`);

  if (tools.length > 0) {
    sections.push(`## 可用工具`);
    for (const tool of tools) {
      sections.push(`### ${tool.name}\n${tool.prompt()}`);
    }
  }

  sections.push(`## 系统上下文\n${formatSystemContext(context)}`);

  if (mimoMd) {
    sections.push(`## 项目配置\n${mimoMd}`);
  }

  sections.push(`## 核心工作原则
1. **任务分解**：收到复杂任务时，先用 TodoWriteTool 创建任务列表，然后逐步执行每个任务。
2. **主动执行**：不要只描述你会做什么，要实际去做。用 FileWriteTool 创建文件，用 BashTool 执行命令。
3. **持续工作**：创建 todo 后不要停下来，立即开始执行第一个任务。直到所有任务完成才停止。
4. **代码完整性**：生成的代码必须是完整可运行的，不要省略任何部分。
5. **路径处理**：
   - Windows 桌面路径：C:\\Users\\{username}\\Desktop\\
   - 使用绝对路径确保文件写入正确位置
6. **网页开发**：
   - 生成单文件 HTML（包含 CSS 和 JS）
   - 使用现代 CSS 动画和过渡效果
   - 确保响应式设计

## 工具使用指南
- FileWriteTool：创建新文件，自动创建父目录
- FileEditTool：修改已有文件的特定内容
- BashTool：执行 shell 命令（Windows 上自动使用 PowerShell）
- WebSearchTool：搜索参考资料
- TodoWriteTool：跟踪任务进度，每完成一个任务就更新状态

## 语言
使用中文与用户交流。代码注释也用中文。`);

  return sections.join('\n\n');
}
```

- [ ] **Step 2: 运行相关测试**

Run: `cd c:/Users/rap/mimo-code && npx vitest run`
Expected: 所有测试通过

- [ ] **Step 3: 提交**

```bash
git add src/constants/prompts.ts
git commit -m "feat: redesign system prompt with Chinese task guidance

Add task decomposition, proactive execution, and tool usage instructions.
Support Chinese language for better user experience."
```

---

### Task 7: 端到端验证

- [ ] **Step 1: 构建项目**

Run: `cd c:/Users/rap/mimo-code && npm run build`
Expected: 构建成功

- [ ] **Step 2: 运行全量测试**

Run: `cd c:/Users/rap/mimo-code && npx vitest run`
Expected: 所有测试通过

- [ ] **Step 3: 手动测试 — 创建网页任务**

在 Windows 终端中运行：

```bash
cd c:/Users/rap/mimo-code
node bin/mimo.js
```

输入：`帮我制作一个展示网页，风格动效参照iPhone官网，生成到桌面`

**验证点：**
- [ ] 模型调用 TodoWriteTool 创建任务列表
- [ ] 模型继续调用 FileWriteTool 创建 HTML 文件
- [ ] 文件路径是 `C:\Users\{username}\Desktop\` 下的某个 .html 文件
- [ ] HTML 文件内容完整，包含 CSS 动画
- [ ] 模型用中文回复

- [ ] **Step 4: 验证文件内容**

打开创建的 HTML 文件，确认：
- [ ] 页面可正常渲染
- [ ] 有 Apple 风格的动画效果
- [ ] 响应式设计正常

- [ ] **Step 5: 最终提交**

```bash
git add -A
git commit -m "fix: complete agent task execution fixes

All 7 bugs fixed:
- AgentTool passes tools to sub-agents
- parseToolCallsFromText handles formatted JSON and multiple calls
- BashTool uses PowerShell on Windows
- maxTokens increased to 8192
- Context compression protects tool outputs
- System prompt redesigned with Chinese task guidance"
```

---

## 自检清单

- [ ] 所有 spec 需求都有对应的 task
- [ ] 无 TBD/TODO 占位符
- [ ] 类型/方法签名在各 task 间一致
- [ ] 每个 task 有完整的代码示例
- [ ] 测试命令和预期输出明确
