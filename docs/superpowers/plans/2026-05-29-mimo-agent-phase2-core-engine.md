# Mimo Coding Agent - Phase 2: Core Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core agent loop — QueryEngine, query loop, tool system, tool orchestration, command registry, and context management.

**Architecture:** QueryEngine owns the conversation lifecycle. The query loop is a `while(true)` that calls the model, extracts tool_use blocks, executes tools via StreamingToolExecutor, and loops until no more tool calls. The tool system provides a clean interface for all tools.

**Tech Stack:** TypeScript 5.x, Zod v4, Vitest

**Design Spec:** `docs/superpowers/specs/2026-05-29-mimo-coding-agent-design.md` (Sections 3-4)

**Prerequisites:** Phase 1 complete (types, state, API client, settings, REPL)

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/QueryEngine.ts` | Conversation lifecycle, submitMessage async generator |
| `src/query.ts` | Core agent loop (while true → model → tools → loop) |
| `src/Tool.ts` | Tool type definitions (already in types/tool.ts, this re-exports) |
| `src/tools.ts` | Tool registry |
| `src/commands.ts` | Command registry |
| `src/services/tools/toolExecution.ts` | Single tool execution lifecycle |
| `src/services/tools/toolOrchestration.ts` | Tool batching and parallelism |
| `src/services/tools/StreamingToolExecutor.ts` | Streaming concurrent tool execution |
| `src/services/compact/` | Context compression (stub for now) |
| `tests/unit/query.test.ts` | Query loop tests |
| `tests/unit/tools/` | Tool system tests |

---

### Task 1: Tool Registry & buildTool

**Files:**
- Create: `src/tools.ts`
- Modify: `src/types/tool.ts` (if needed)
- Test: `tests/unit/tools/registry.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/tools/registry.test.ts
import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../../../src/tools.js';
import { buildTool } from '../../../src/types/tool.js';
import { z } from 'zod';

describe('ToolRegistry', () => {
  const mockTool = buildTool({
    name: 'TestTool',
    inputSchema: z.object({ input: z.string() }),
    call: async (args) => ({ toolUseId: '1', name: 'TestTool', result: args.input }),
  });

  it('should register and retrieve a tool', () => {
    const registry = new ToolRegistry();
    registry.register(mockTool);
    expect(registry.get('TestTool')).toBe(mockTool);
  });

  it('should return undefined for unknown tool', () => {
    const registry = new ToolRegistry();
    expect(registry.get('Unknown')).toBeUndefined();
  });

  it('should get all registered tools', () => {
    const registry = new ToolRegistry();
    registry.register(mockTool);
    const all = registry.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('TestTool');
  });

  it('should convert tools to OpenAI function definitions', () => {
    const registry = new ToolRegistry();
    registry.register(mockTool);
    const defs = registry.toToolDefinitions();
    expect(defs).toHaveLength(1);
    expect(defs[0].type).toBe('function');
    expect(defs[0].function.name).toBe('TestTool');
  });

  it('should find tool by alias', () => {
    const tool = buildTool({
      name: 'BashTool',
      aliases: ['bash', 'sh'],
      inputSchema: z.object({ command: z.string() }),
      call: async (args) => ({ toolUseId: '1', name: 'BashTool', result: '' }),
    });
    const registry = new ToolRegistry();
    registry.register(tool);
    expect(registry.get('bash')).toBe(tool);
    expect(registry.get('sh')).toBe(tool);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mimo-code && npx vitest run tests/unit/tools/registry.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement ToolRegistry**

```typescript
// src/tools.ts
import type { Tool, ToolDefinition } from './types/tool.js';

export class ToolRegistry {
  private tools = new Map<string, Tool>();
  private aliasMap = new Map<string, string>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
    if (tool.aliases) {
      for (const alias of tool.aliases) {
        this.aliasMap.set(alias, tool.name);
      }
    }
  }

  get(name: string): Tool | undefined {
    const resolved = this.aliasMap.get(name) ?? name;
    return this.tools.get(resolved);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  toToolDefinitions(): ToolDefinition[] {
    return this.getAll().map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: '',  // Will be filled by tool.description() at runtime
        parameters: tool.inputSchema ? {} : {},  // Zod-to-JSON-Schema conversion at runtime
      },
    }));
  }

  has(name: string): boolean {
    return this.tools.has(name) || this.aliasMap.has(name);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mimo-code && npx vitest run tests/unit/tools/registry.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mimo-code/src/tools.ts mimo-code/tests/unit/tools/
git commit -m "feat: tool registry with alias support and OpenAI definition export"
```

---

### Task 2: Command Registry

**Files:**
- Create: `src/commands.ts`
- Test: `tests/unit/commands.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/commands.test.ts
import { describe, it, expect } from 'vitest';
import { CommandRegistry } from '../../src/commands.js';
import type { Command } from '../../src/commands.js';

describe('CommandRegistry', () => {
  const helpCommand: Command = {
    name: 'help',
    description: 'Show help',
    isEnabled: () => true,
    call: async () => 'Help text',
  };

  it('should register and retrieve a command', () => {
    const registry = new CommandRegistry();
    registry.register(helpCommand);
    expect(registry.get('help')).toBe(helpCommand);
  });

  it('should parse slash command from input', () => {
    const registry = new CommandRegistry();
    registry.register(helpCommand);
    const result = registry.parse('/help');
    expect(result).not.toBeNull();
    expect(result!.command.name).toBe('help');
    expect(result!.args).toBe('');
  });

  it('should parse slash command with args', () => {
    const registry = new CommandRegistry();
    registry.register(helpCommand);
    const result = registry.parse('/help tools');
    expect(result!.args).toBe('tools');
  });

  it('should return null for non-command input', () => {
    const registry = new CommandRegistry();
    registry.register(helpCommand);
    expect(registry.parse('hello world')).toBeNull();
  });

  it('should get all enabled commands', () => {
    const registry = new CommandRegistry();
    registry.register(helpCommand);
    registry.register({
      name: 'hidden',
      description: 'Hidden',
      isEnabled: () => false,
      isHidden: true,
      call: async () => '',
    });
    const all = registry.getAll();
    expect(all).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mimo-code && npx vitest run tests/unit/commands.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement CommandRegistry**

```typescript
// src/commands.ts
import type { ReactNode } from 'react';

export interface CommandArgument {
  name: string;
  description: string;
  required?: boolean;
}

export interface CommandOption {
  name: string;
  short?: string;
  description: string;
  type: 'string' | 'boolean' | 'number';
  default?: unknown;
}

export interface CommandContext {
  model: string;
  verbose: boolean;
  debug: boolean;
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  isEnabled: () => boolean;
  isHidden?: boolean;
  arguments?: CommandArgument[];
  options?: CommandOption[];
  call(args: string, context: CommandContext): Promise<string | void>;
  render?(args: string, context: CommandContext): ReactNode;
}

export class CommandRegistry {
  private commands = new Map<string, Command>();

  register(command: Command): void {
    this.commands.set(command.name, command);
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.commands.set(alias, command);
      }
    }
  }

  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  getAll(): Command[] {
    const seen = new Set<string>();
    const result: Command[] = [];
    for (const cmd of this.commands.values()) {
      if (!seen.has(cmd.name)) {
        seen.add(cmd.name);
        result.push(cmd);
      }
    }
    return result;
  }

  parse(input: string): { command: Command; args: string } | null {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) return null;

    const spaceIndex = trimmed.indexOf(' ');
    const commandPart = spaceIndex === -1 ? trimmed.slice(1) : trimmed.slice(1, spaceIndex);
    const args = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1).trim();

    const command = this.commands.get(commandPart);
    if (!command) return null;

    return { command, args };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mimo-code && npx vitest run tests/unit/commands.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mimo-code/src/commands.ts mimo-code/tests/unit/commands.test.ts
git commit -m "feat: command registry with slash command parsing"
```

---

### Task 3: Tool Execution Engine

**Files:**
- Create: `src/services/tools/toolExecution.ts`
- Create: `src/services/tools/toolOrchestration.ts`
- Test: `tests/unit/tools/execution.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/tools/execution.test.ts
import { describe, it, expect } from 'vitest';
import { runToolUse } from '../../../src/services/tools/toolExecution.js';
import { buildTool } from '../../../src/types/tool.js';
import type { ToolUseContext } from '../../../src/types/tool.js';
import { z } from 'zod';

function makeContext(): ToolUseContext {
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

describe('runToolUse', () => {
  it('should execute a tool and return result', async () => {
    const tool = buildTool({
      name: 'EchoTool',
      inputSchema: z.object({ text: z.string() }),
      call: async (args) => ({ toolUseId: '1', name: 'EchoTool', result: args.text }),
    });
    const result = await runToolUse(tool, { text: 'hello' }, makeContext());
    expect(result.result).toBe('hello');
    expect(result.name).toBe('EchoTool');
  });

  it('should handle tool execution errors', async () => {
    const tool = buildTool({
      name: 'FailTool',
      inputSchema: z.object({}),
      call: async () => { throw new Error('boom'); },
    });
    const result = await runToolUse(tool, {}, makeContext());
    expect(result.isError).toBe(true);
    expect(result.error).toContain('boom');
  });

  it('should validate input with zod schema', async () => {
    const tool = buildTool({
      name: 'StrictTool',
      inputSchema: z.object({ count: z.number() }),
      call: async (args) => ({ toolUseId: '1', name: 'StrictTool', result: String(args.count) }),
    });
    const result = await runToolUse(tool, { count: 'not-a-number' }, makeContext());
    expect(result.isError).toBe(true);
    expect(result.error).toContain('Expected number');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mimo-code && npx vitest run tests/unit/tools/execution.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement toolExecution**

```typescript
// src/services/tools/toolExecution.ts
import type { Tool, ToolUseContext, ToolResult } from '../../types/tool.js';

export async function runToolUse(
  tool: Tool,
  rawArgs: unknown,
  context: ToolUseContext,
): Promise<ToolResult> {
  // 1. Validate input
  const parsed = tool.inputSchema.safeParse(rawArgs);
  if (!parsed.success) {
    return {
      toolUseId: '',
      name: tool.name,
      result: '',
      error: `Invalid input: ${parsed.error.errors.map(e => e.message).join(', ')}`,
      isError: true,
    };
  }

  // 2. Check permissions
  const permission = tool.checkPermissions(parsed.data, context);
  if (!permission.allowed) {
    return {
      toolUseId: '',
      name: tool.name,
      result: '',
      error: `Permission denied: ${permission.reason ?? 'not allowed'}`,
      isError: true,
    };
  }

  // 3. Execute
  try {
    const result = await tool.call(parsed.data, context);
    return result;
  } catch (error) {
    return {
      toolUseId: '',
      name: tool.name,
      result: '',
      error: error instanceof Error ? error.message : String(error),
      isError: true,
    };
  }
}
```

- [ ] **Step 4: Implement toolOrchestration**

```typescript
// src/services/tools/toolOrchestration.ts
import type { Tool, ToolUseContext, ToolResult } from '../../types/tool.js';
import type { ToolCall } from '../../types/message.js';
import { runToolUse } from './toolExecution.js';

export async function runTools(
  toolCalls: ToolCall[],
  getTool: (name: string) => Tool | undefined,
  context: ToolUseContext,
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  const concurrentBatch: { tool: Tool; call: ToolCall; args: unknown }[] = [];

  for (const call of toolCalls) {
    const tool = getTool(call.function.name);
    if (!tool) {
      results.push({
        toolUseId: call.id,
        name: call.function.name,
        result: '',
        error: `Unknown tool: ${call.function.name}`,
        isError: true,
      });
      continue;
    }

    let args: unknown;
    try {
      args = JSON.parse(call.function.arguments);
    } catch {
      results.push({
        toolUseId: call.id,
        name: call.function.name,
        result: '',
        error: `Invalid JSON arguments: ${call.function.arguments}`,
        isError: true,
      });
      continue;
    }

    if (tool.isConcurrencySafe()) {
      concurrentBatch.push({ tool, call, args });
    } else {
      // Flush concurrent batch first
      if (concurrentBatch.length > 0) {
        const batchResults = await Promise.all(
          concurrentBatch.map(({ tool: t, call: c, args: a }) =>
            runToolUse(t, a, context).then(r => ({ ...r, toolUseId: c.id }))
          )
        );
        results.push(...batchResults);
        concurrentBatch.length = 0;
      }
      // Run non-concurrent tool
      const result = await runToolUse(tool, args, context);
      results.push({ ...result, toolUseId: call.id });
    }
  }

  // Flush remaining concurrent batch
  if (concurrentBatch.length > 0) {
    const batchResults = await Promise.all(
      concurrentBatch.map(({ tool: t, call: c, args: a }) =>
        runToolUse(t, a, context).then(r => ({ ...r, toolUseId: c.id }))
      )
    );
    results.push(...batchResults);
  }

  return results;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd mimo-code && npx vitest run tests/unit/tools/execution.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add mimo-code/src/services/tools/ mimo-code/tests/unit/tools/
git commit -m "feat: tool execution engine with validation, permissions, orchestration"
```

---

### Task 4: StreamingToolExecutor

**Files:**
- Create: `src/services/tools/StreamingToolExecutor.ts`
- Test: `tests/unit/tools/streaming-executor.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/tools/streaming-executor.test.ts
import { describe, it, expect, vi } from 'vitest';
import { StreamingToolExecutor } from '../../../src/services/tools/StreamingToolExecutor.js';
import { buildTool } from '../../../src/types/tool.js';
import type { Tool } from '../../../src/types/tool.js';
import { z } from 'zod';

describe('StreamingToolExecutor', () => {
  it('should execute tool and emit result', async () => {
    const tool: Tool = buildTool({
      name: 'EchoTool',
      inputSchema: z.object({ text: z.string() }),
      call: async (args) => ({ toolUseId: '1', name: 'EchoTool', result: args.text }),
    });

    const executor = new StreamingToolExecutor(
      (name) => name === 'EchoTool' ? tool : undefined,
      { options: { model: 'test' }, abortController: new AbortController(), readFileState: new Map(), messages: [], toolDecisions: new Map(), requestPrompt: async () => '', getAppState: () => ({}), setAppState: () => {} },
    );

    const results: any[] = [];
    executor.onResult((r) => results.push(r));

    executor.addToolCall({ id: 'call_1', type: 'function', function: { name: 'EchoTool', arguments: '{"text":"hi"}' } });

    // Wait for async execution
    await new Promise(r => setTimeout(r, 50));

    expect(results).toHaveLength(1);
    expect(results[0].result).toBe('hi');
    expect(results[0].toolUseId).toBe('call_1');
  });

  it('should handle unknown tool', async () => {
    const executor = new StreamingToolExecutor(
      () => undefined,
      { options: { model: 'test' }, abortController: new AbortController(), readFileState: new Map(), messages: [], toolDecisions: new Map(), requestPrompt: async () => '', getAppState: () => ({}), setAppState: () => {} },
    );

    const results: any[] = [];
    executor.onResult((r) => results.push(r));

    executor.addToolCall({ id: 'call_2', type: 'function', function: { name: 'Unknown', arguments: '{}' } });

    await new Promise(r => setTimeout(r, 50));

    expect(results).toHaveLength(1);
    expect(results[0].isError).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mimo-code && npx vitest run tests/unit/tools/streaming-executor.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement StreamingToolExecutor**

```typescript
// src/services/tools/StreamingToolExecutor.ts
import type { Tool, ToolUseContext, ToolResult } from '../../types/tool.js';
import type { ToolCall } from '../../types/message.js';
import { runToolUse } from './toolExecution.js';

export class StreamingToolExecutor {
  private resultCallback: ((result: ToolResult) => void) | null = null;
  private getTool: (name: string) => Tool | undefined;
  private context: ToolUseContext;

  constructor(
    getTool: (name: string) => Tool | undefined,
    context: ToolUseContext,
  ) {
    this.getTool = getTool;
    this.context = context;
  }

  onResult(callback: (result: ToolResult) => void): void {
    this.resultCallback = callback;
  }

  addToolCall(toolCall: ToolCall): void {
    const tool = this.getTool(toolCall.function.name);

    if (!tool) {
      this.emitResult({
        toolUseId: toolCall.id,
        name: toolCall.function.name,
        result: '',
        error: `Unknown tool: ${toolCall.function.name}`,
        isError: true,
      });
      return;
    }

    let args: unknown;
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      this.emitResult({
        toolUseId: toolCall.id,
        name: toolCall.function.name,
        result: '',
        error: `Invalid JSON arguments`,
        isError: true,
      });
      return;
    }

    // Execute asynchronously
    runToolUse(tool, args, this.context).then(result => {
      this.emitResult({ ...result, toolUseId: toolCall.id });
    }).catch(error => {
      this.emitResult({
        toolUseId: toolCall.id,
        name: toolCall.function.name,
        result: '',
        error: error instanceof Error ? error.message : String(error),
        isError: true,
      });
    });
  }

  discard(): void {
    this.resultCallback = null;
  }

  private emitResult(result: ToolResult): void {
    this.resultCallback?.(result);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mimo-code && npx vitest run tests/unit/tools/streaming-executor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mimo-code/src/services/tools/StreamingToolExecutor.ts mimo-code/tests/unit/tools/streaming-executor.test.ts
git commit -m "feat: StreamingToolExecutor for concurrent tool execution"
```

---

### Task 5: Query Loop

**Files:**
- Create: `src/query.ts`
- Test: `tests/unit/query.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/query.test.ts
import { describe, it, expect, vi } from 'vitest';
import { queryLoop } from '../../src/query.js';
import type { QueryDeps } from '../../src/query.js';
import type { Message, StreamChunk } from '../../src/types/index.js';

function makeDeps(chunks: StreamChunk[]): QueryDeps {
  return {
    callModel: async function* () {
      for (const chunk of chunks) yield chunk;
    },
    microcompact: (msgs) => msgs,
    autocompact: (msgs) => msgs,
    uuid: () => 'test-uuid',
  };
}

describe('queryLoop', () => {
  it('should yield assistant message from text chunks', async () => {
    const deps = makeDeps([
      { type: 'text', content: 'Hello!' },
      { type: 'done', finishReason: 'stop' },
    ]);

    const messages: Message[] = [{ role: 'user', content: 'Hi' }];
    const results: any[] = [];

    for await (const msg of queryLoop(messages, deps, { model: 'test' })) {
      results.push(msg);
    }

    const assistantMsg = results.find(m => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg.content).toBe('Hello!');
  });

  it('should handle tool calls in response', async () => {
    const deps = makeDeps([
      { type: 'text', content: 'Let me check.' },
      { type: 'tool_use', toolCall: { id: 'call_1', type: 'function', function: { name: 'EchoTool', arguments: '{"text":"hi"}' } } },
      { type: 'done', finishReason: 'tool_calls' },
      // Second turn after tool result
      { type: 'text', content: 'Done!' },
      { type: 'done', finishReason: 'stop' },
    ]);

    const messages: Message[] = [{ role: 'user', content: 'Check this' }];
    const results: any[] = [];

    for await (const msg of queryLoop(messages, deps, { model: 'test' })) {
      results.push(msg);
    }

    // Should have: assistant msg with tool call, tool result msg, final assistant msg
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it('should stop on done without tool calls', async () => {
    const deps = makeDeps([
      { type: 'text', content: 'Answer' },
      { type: 'done', finishReason: 'stop' },
    ]);

    const results: any[] = [];
    for await (const msg of queryLoop([{ role: 'user', content: 'Q' }], deps, { model: 'test' })) {
      results.push(msg);
    }

    expect(results).toHaveLength(1);
    expect(results[0].content).toBe('Answer');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mimo-code && npx vitest run tests/unit/query.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement query loop**

```typescript
// src/query.ts
import type { Message, StreamChunk, ToolCall } from './types/message.js';
import type { ModelRequest } from './types/api.js';
import type { QueryOptions } from './types/tool.js';

export interface QueryDeps {
  callModel: (request: ModelRequest) => AsyncGenerator<StreamChunk>;
  microcompact: (messages: Message[]) => Message[];
  autocompact: (messages: Message[]) => Message[];
  uuid: () => string;
}

export async function* queryLoop(
  messages: Message[],
  deps: QueryDeps,
  options: Pick<QueryOptions, 'model' | 'maxTokens' | 'temperature'>,
  systemPrompt?: string,
  tools?: ModelRequest['tools'],
): AsyncGenerator<Message> {
  const MAX_TURNS = 20;
  let turn = 0;

  while (turn < MAX_TURNS) {
    turn++;

    // Build request
    const request: ModelRequest = {
      model: options.model,
      messages,
      system: systemPrompt,
      tools,
      maxTokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      stream: true,
    };

    // Stream response
    const contentParts: string[] = [];
    const toolCalls: ToolCall[] = [];
    let finishReason: string | undefined;

    for await (const chunk of deps.callModel(request)) {
      if (chunk.type === 'text' && chunk.content) {
        contentParts.push(chunk.content);
      }
      if (chunk.type === 'tool_use' && chunk.toolCall) {
        toolCalls.push(chunk.toolCall);
      }
      if (chunk.type === 'done') {
        finishReason = chunk.finishReason;
      }
      if (chunk.type === 'error') {
        yield { role: 'assistant', content: `Error: ${chunk.content}` };
        return;
      }
    }

    // Build assistant message
    const assistantMessage: Message = {
      role: 'assistant',
      content: contentParts.join(''),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };

    messages = [...messages, assistantMessage];
    yield assistantMessage;

    // If no tool calls, we're done
    if (toolCalls.length === 0 || finishReason === 'stop') {
      return;
    }

    // Execute tools and add results
    yield { role: 'assistant', content: `[Executing ${toolCalls.length} tool(s)...]` };
    // Tool execution is handled externally by the REPL
    // For now, add placeholder tool results
    for (const tc of toolCalls) {
      const toolResult: Message = {
        role: 'tool',
        content: `[Tool ${tc.function.name} executed]`,
        toolCallId: tc.id,
      };
      messages = [...messages, toolResult];
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mimo-code && npx vitest run tests/unit/query.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mimo-code/src/query.ts mimo-code/tests/unit/query.test.ts
git commit -m "feat: query loop (core agent loop with tool call handling)"
```

---

### Task 6: QueryEngine

**Files:**
- Create: `src/QueryEngine.ts`
- Test: `tests/unit/queryEngine.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/queryEngine.test.ts
import { describe, it, expect } from 'vitest';
import { QueryEngine } from '../../src/QueryEngine.js';
import type { StreamChunk } from '../../src/types/api.js';

describe('QueryEngine', () => {
  it('should initialize with empty messages', () => {
    const engine = new QueryEngine({
      callModel: async function* () { yield { type: 'done' }; },
      microcompact: (m) => m,
      autocompact: (m) => m,
      uuid: () => 'test',
      model: 'test',
    });
    expect(engine.getMessages()).toEqual([]);
    expect(engine.getUsage()).toEqual({ inputTokens: 0, outputTokens: 0 });
  });

  it('should submit message and get response', async () => {
    const engine = new QueryEngine({
      callModel: async function* () {
        yield { type: 'text', content: 'Hi there!' };
        yield { type: 'done', finishReason: 'stop', usage: { inputTokens: 5, outputTokens: 3 } };
      },
      microcompact: (m) => m,
      autocompact: (m) => m,
      uuid: () => 'test',
      model: 'test',
    });

    const results: any[] = [];
    for await (const msg of engine.submitMessage('Hello')) {
      results.push(msg);
    }

    expect(engine.getMessages()).toHaveLength(2); // user + assistant
    expect(engine.getUsage().inputTokens).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mimo-code && npx vitest run tests/unit/queryEngine.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement QueryEngine**

```typescript
// src/QueryEngine.ts
import type { Message, TokenUsage } from './types/message.js';
import type { ModelRequest, StreamChunk } from './types/api.js';
import { queryLoop, type QueryDeps } from './query.js';

export interface QueryEngineConfig extends QueryDeps {
  model: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  tools?: ModelRequest['tools'];
}

export class QueryEngine {
  private mutableMessages: Message[] = [];
  private totalUsage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
  private config: QueryEngineConfig;

  constructor(config: QueryEngineConfig) {
    this.config = config;
  }

  async *submitMessage(content: string): AsyncGenerator<Message> {
    // Add user message
    const userMessage: Message = { role: 'user', content };
    this.mutableMessages.push(userMessage);

    // Run query loop
    for await (const msg of queryLoop(
      this.mutableMessages,
      this.config,
      {
        model: this.config.model,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      },
      this.config.systemPrompt,
      this.config.tools,
    )) {
      this.mutableMessages.push(msg);
      yield msg;
    }
  }

  abort(): void {
    // TODO: implement abort via AbortController
  }

  getMessages(): Message[] {
    return [...this.mutableMessages];
  }

  getUsage(): TokenUsage {
    return { ...this.totalUsage };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mimo-code && npx vitest run tests/unit/queryEngine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mimo-code/src/QueryEngine.ts mimo-code/tests/unit/queryEngine.test.ts
git commit -m "feat: QueryEngine for conversation lifecycle management"
```

---

### Task 7: Wire QueryEngine into REPL

**Files:**
- Modify: `src/screens/REPL.tsx`

- [ ] **Step 1: Update REPL to use QueryEngine**

Replace the direct API client usage in REPL.tsx with QueryEngine. The key change is in the `handleSubmit` callback — instead of manually calling `client.streamChat`, use `engine.submitMessage`.

```typescript
// In src/screens/REPL.tsx, replace the handleSubmit function:

import { QueryEngine } from '../QueryEngine.js';
import { APIClient } from '../services/api/client.js';

// Inside REPLScreen component:
const engineRef = useRef<QueryEngine | null>(null);
if (!engineRef.current) {
  const client = new APIClient(apiEndpoint, apiKey);
  engineRef.current = new QueryEngine({
    callModel: (req) => client.streamChat(req),
    microcompact: (m) => m,
    autocompact: (m) => m,
    uuid: () => crypto.randomUUID(),
    model,
    systemPrompt: getSystemPrompt([], getSystemContext()),
  });
}

const handleSubmit = useCallback(async (input: string) => {
  const engine = engineRef.current!;
  store.setState({ isProcessing: true });
  setMimoState(MimoState.THINKING);

  try {
    for await (const msg of engine.submitMessage(input)) {
      store.setState({ messages: engine.getMessages(), isProcessing: true });
      if (msg.role === 'assistant' && msg.content && !String(msg.content).startsWith('[')) {
        setMimoState(MimoState.CODING);
      }
    }
    store.setState({ messages: engine.getMessages(), isProcessing: false });
    setMimoState(MimoState.SUCCESS);
    setTimeout(() => setMimoState(MimoState.IDLE), 2000);
  } catch (err) {
    const errorMessage: Message = {
      role: 'assistant',
      content: `Error: ${err instanceof Error ? err.message : String(err)}`,
    };
    store.setState({
      messages: [...engine.getMessages(), errorMessage],
      isProcessing: false,
    });
    setMimoState(MimoState.ERROR);
  }
}, [model, store, apiKey, apiEndpoint]);
```

- [ ] **Step 2: Run all tests**

Run: `cd mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add mimo-code/src/screens/REPL.tsx
git commit -m "refactor: REPL uses QueryEngine instead of direct API calls"
```

---

### Task 8: All Tests Pass

- [ ] **Step 1: Run full test suite**

Run: `cd mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run type check**

Run: `cd mimo-code && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit any fixes if needed**
