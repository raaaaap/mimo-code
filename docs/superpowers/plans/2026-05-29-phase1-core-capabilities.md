# Phase 1: Core Capabilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 core capabilities: single/pipe mode, streaming tool execution, token budget management, tool call summarization, and history persistence.

**Architecture:** Single/pipe mode adds non-interactive execution paths in main.tsx. Streaming tools enhance the existing query loop. Token budget, tool summary, and history are new service modules integrated into QueryEngine.

**Tech Stack:** TypeScript 5.x, Vitest, Commander.js, existing mimo-code patterns

**Design Spec:** `docs/superpowers/specs/2026-05-29-implementation-roadmap.md` (Phase 1 section)

---

## File Structure

### New Files
- `src/modes/single.ts` — Single-shot execution mode
- `src/modes/pipe.ts` — Pipe/stdin execution mode
- `src/query/tokenBudget.ts` — Token budget tracking and continuation decisions
- `src/services/tools/toolSummary.ts` — Tool output summarization
- `src/history/store.ts` — History persistence to disk
- `src/history/types.ts` — History entry types
- `src/commands/resume.ts` — /resume command
- `tests/unit/modes/single.test.ts`
- `tests/unit/modes/pipe.test.ts`
- `tests/unit/query/tokenBudget.test.ts`
- `tests/unit/tools/toolSummary.test.ts`
- `tests/unit/history/store.test.ts`

### Modified Files
- `src/main.tsx` — Route to single/pipe modes
- `src/query.ts` — Integrate streaming tools, token budget, tool summary
- `src/QueryEngine.ts` — Add token budget tracking
- `src/services/tools/StreamingToolExecutor.ts` — Enhance for query loop integration
- `src/screens/REPL.tsx` — Register /resume command

---

## Task 1: Single Mode

**Files:**
- Create: `src/modes/single.ts`
- Modify: `src/main.tsx`
- Test: `tests/unit/modes/single.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/modes/single.test.ts
import { describe, it, expect, vi } from 'vitest';
import { runSingleMode } from '../../../src/modes/single.js';

describe('runSingleMode', () => {
  it('calls model once and prints result', async () => {
    const mockCallModel = async function* () {
      yield { type: 'text' as const, content: 'Hello world' };
      yield { type: 'done' as const, finishReason: 'stop' };
    };
    const output: string[] = [];
    const mockPrint = (text: string) => output.push(text);

    await runSingleMode({
      prompt: 'say hello',
      model: 'mimo-large',
      maxTokens: 4096,
      temperature: 0.7,
      systemPrompt: 'You are helpful.',
      callModel: mockCallModel as any,
      print: mockPrint,
    });

    expect(output.join('')).toContain('Hello world');
  });

  it('exits with code 0 on success', async () => {
    const mockCallModel = async function* () {
      yield { type: 'text' as const, content: 'ok' };
      yield { type: 'done' as const, finishReason: 'stop' };
    };

    const exitCode = await runSingleMode({
      prompt: 'test',
      model: 'mimo-large',
      maxTokens: 4096,
      temperature: 0.7,
      callModel: mockCallModel as any,
      print: () => {},
    });

    expect(exitCode).toBe(0);
  });

  it('exits with code 1 on error', async () => {
    const mockCallModel = async function* () {
      yield { type: 'error' as const, content: 'API failed' };
    };

    const exitCode = await runSingleMode({
      prompt: 'test',
      model: 'mimo-large',
      maxTokens: 4096,
      temperature: 0.7,
      callModel: mockCallModel as any,
      print: () => {},
    });

    expect(exitCode).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/modes/single.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement single mode**

```ts
// src/modes/single.ts
import type { ModelRequest, StreamChunk } from '../types/api.js';

export interface SingleModeOptions {
  prompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  callModel: (request: ModelRequest) => AsyncGenerator<StreamChunk>;
  print: (text: string) => void;
}

export async function runSingleMode(options: SingleModeOptions): Promise<number> {
  const { prompt, model, maxTokens, temperature, systemPrompt, callModel, print } = options;

  try {
    const request: ModelRequest = {
      model,
      messages: [{ role: 'user', content: prompt }],
      system: systemPrompt,
      maxTokens,
      temperature,
      stream: true,
    };

    for await (const chunk of callModel(request)) {
      if (chunk.type === 'text' && chunk.content) {
        print(chunk.content);
      }
      if (chunk.type === 'error') {
        print(`Error: ${chunk.content}`);
        return 1;
      }
      if (chunk.type === 'done') {
        break;
      }
    }

    return 0;
  } catch (error) {
    print(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/modes/single.test.ts`
Expected: PASS

- [ ] **Step 5: Wire into main.tsx**

In `src/main.tsx`, replace the `else` branch (line ~98) that prints "Single/pipe mode not yet implemented":

```tsx
// Replace:
// } else {
//   console.error('Single/pipe mode not yet implemented');
//   process.exit(1);
// }

// With:
} else if (cliOptions.mode === 'single' || (prompt && cliOptions.mode === 'interactive')) {
  // Single mode: prompt provided as argument
  const { runSingleMode } = await import('./modes/single.js');
  const { APIClient } = await import('./services/api/client.js');
  const client = new APIClient(endpoint, apiKey);
  const exitCode = await runSingleMode({
    prompt: prompt!,
    model: cliOptions.model,
    maxTokens: cliOptions.maxTokens,
    temperature: cliOptions.temperature,
    callModel: (req) => client.streamChat(req),
    print: (text) => process.stdout.write(text),
  });
  process.exit(exitCode);
} else if (cliOptions.mode === 'pipe') {
  const { runPipeMode } = await import('./modes/pipe.js');
  const { APIClient } = await import('./services/api/client.js');
  const client = new APIClient(endpoint, apiKey);
  const exitCode = await runPipeMode({
    model: cliOptions.model,
    maxTokens: cliOptions.maxTokens,
    temperature: cliOptions.temperature,
    callModel: (req) => client.streamChat(req),
    print: (text) => process.stdout.write(text),
  });
  process.exit(exitCode);
}
```

Also update the argument handling: if a prompt is provided as argument and mode is still 'interactive', switch to single mode.

- [ ] **Step 6: Run all tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
cd c:/Users/rap/mimo-code/mimo-code
git add src/modes/single.ts src/main.tsx tests/unit/modes/single.test.ts
git commit -m "feat(modes): implement single-shot execution mode"
```

---

## Task 2: Pipe Mode

**Files:**
- Create: `src/modes/pipe.ts`
- Modify: `src/main.tsx`
- Test: `tests/unit/modes/pipe.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/modes/pipe.test.ts
import { describe, it, expect } from 'vitest';
import { runPipeMode } from '../../../src/modes/pipe.js';

describe('runPipeMode', () => {
  it('reads from stdin and prints model response', async () => {
    const mockCallModel = async function* () {
      yield { type: 'text' as const, content: 'Response text' };
      yield { type: 'done' as const, finishReason: 'stop' };
    };
    const output: string[] = [];

    await runPipeMode({
      model: 'mimo-large',
      maxTokens: 4096,
      temperature: 0.7,
      callModel: mockCallModel as any,
      print: (text) => output.push(text),
      readStdin: async () => 'stdin content here',
    });

    expect(output.join('')).toContain('Response text');
  });

  it('returns 1 on empty stdin', async () => {
    const exitCode = await runPipeMode({
      model: 'mimo-large',
      maxTokens: 4096,
      temperature: 0.7,
      callModel: async function* () {} as any,
      print: () => {},
      readStdin: async () => '',
    });

    expect(exitCode).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/modes/pipe.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement pipe mode**

```ts
// src/modes/pipe.ts
import type { ModelRequest, StreamChunk } from '../types/api.js';

export interface PipeModeOptions {
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  callModel: (request: ModelRequest) => AsyncGenerator<StreamChunk>;
  print: (text: string) => void;
  readStdin?: () => Promise<string>;
}

async function defaultReadStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8').trim();
}

export async function runPipeMode(options: PipeModeOptions): Promise<number> {
  const { model, maxTokens, temperature, systemPrompt, callModel, print, readStdin } = options;

  const input = await (readStdin ?? defaultReadStdin)();
  if (!input) {
    print('Error: No input from stdin');
    return 1;
  }

  try {
    const request: ModelRequest = {
      model,
      messages: [{ role: 'user', content: input }],
      system: systemPrompt,
      maxTokens,
      temperature,
      stream: true,
    };

    for await (const chunk of callModel(request)) {
      if (chunk.type === 'text' && chunk.content) {
        print(chunk.content);
      }
      if (chunk.type === 'error') {
        print(`Error: ${chunk.content}`);
        return 1;
      }
      if (chunk.type === 'done') {
        break;
      }
    }

    return 0;
  } catch (error) {
    print(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/modes/pipe.test.ts`
Expected: PASS

- [ ] **Step 5: Wire into main.tsx**

Already done in Task 1 Step 5. The `pipe` mode branch is included.

- [ ] **Step 6: Run all tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
cd c:/Users/rap/mimo-code/mimo-code
git add src/modes/pipe.ts tests/unit/modes/pipe.test.ts
git commit -m "feat(modes): implement pipe/stdin execution mode"
```

---

## Task 3: Streaming Tool Execution

**Files:**
- Modify: `src/query.ts`
- Modify: `src/services/tools/StreamingToolExecutor.ts`
- Test: `tests/unit/query/streaming-tools.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/query/streaming-tools.test.ts
import { describe, it, expect, vi } from 'vitest';
import { queryLoop, type QueryDeps } from '../../../src/query.js';
import type { Message } from '../../../src/types/message.js';
import type { StreamChunk } from '../../../src/types/api.js';

function createMockDeps(overrides: Partial<QueryDeps> = {}): QueryDeps {
  return {
    callModel: async function* () {
      yield { type: 'text', content: 'ok' };
      yield { type: 'done', finishReason: 'stop' };
    },
    microcompact: (m) => m,
    autocompact: async (m) => m,
    uuid: () => 'test-uuid',
    getTool: () => undefined,
    toolContext: {
      options: { model: 'test' },
      abortController: new AbortController(),
      readFileState: new Map(),
      messages: [],
      toolDecisions: new Map(),
      requestPrompt: async () => '',
      getAppState: () => ({}),
      setAppState: () => {},
    },
    ...overrides,
  };
}

describe('queryLoop streaming tools', () => {
  it('executes tool calls as they arrive in stream', async () => {
    const toolCallResults: string[] = [];
    const mockTool = {
      name: 'TestTool',
      inputSchema: { safeParse: (v: any) => ({ success: true, data: v }) } as any,
      call: vi.fn().mockResolvedValue({ toolUseId: 'tc1', name: 'TestTool', result: 'tool result' }),
      checkPermissions: () => ({ allowed: true }),
      isConcurrencySafe: () => false,
      isReadOnly: () => false,
      isDestructive: () => false,
      interruptBehavior: () => 'cancel' as const,
      description: async () => 'test',
      prompt: () => 'test',
    };

    let callCount = 0;
    const deps = createMockDeps({
      callModel: async function* () {
        if (callCount === 0) {
          callCount++;
          yield {
            type: 'tool_use',
            toolCall: { id: 'tc1', type: 'function', function: { name: 'TestTool', arguments: '{}' } },
          };
          yield { type: 'done', finishReason: 'tool_use' };
        } else {
          yield { type: 'text', content: 'final answer' };
          yield { type: 'done', finishReason: 'stop' };
        }
      },
      getTool: () => mockTool,
    });

    const messages: Message[] = [{ role: 'user', content: 'test' }];
    const results: Message[] = [];

    for await (const msg of queryLoop(messages, deps, { model: 'test' })) {
      results.push(msg);
    }

    expect(mockTool.call).toHaveBeenCalled();
    expect(results.some(m => m.role === 'tool')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it passes (existing behavior)**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/query/streaming-tools.test.ts`
Expected: PASS (the current query.ts already executes tools sequentially)

- [ ] **Step 3: Enhance StreamingToolExecutor with Promise-based tracking**

The current `StreamingToolExecutor` already fires tools immediately but doesn't track completion. Enhance it to return Promises:

```ts
// src/services/tools/StreamingToolExecutor.ts — add Promise tracking
export class StreamingToolExecutor {
  private resultCallback: ((result: ToolResult) => void) | null = null;
  private pendingResults = new Map<string, { resolve: (r: ToolResult) => void; promise: Promise<ToolResult> }>();
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

  addToolCall(toolCall: ToolCall): Promise<ToolResult> {
    const existing = this.pendingResults.get(toolCall.id);
    if (existing) return existing.promise;

    let resolve!: (r: ToolResult) => void;
    const promise = new Promise<ToolResult>((r) => { resolve = r; });
    this.pendingResults.set(toolCall.id, { resolve, promise });

    const tool = this.getTool(toolCall.function.name);
    if (!tool) {
      const result: ToolResult = {
        toolUseId: toolCall.id,
        name: toolCall.function.name,
        result: '',
        error: `Unknown tool: ${toolCall.function.name}`,
        isError: true,
      };
      resolve(result);
      this.emitResult(result);
      return promise;
    }

    let args: unknown;
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      const result: ToolResult = {
        toolUseId: toolCall.id,
        name: toolCall.function.name,
        result: '',
        error: 'Invalid JSON arguments',
        isError: true,
      };
      resolve(result);
      this.emitResult(result);
      return promise;
    }

    runToolUse(tool, args, this.context)
      .then((result) => {
        const r = { ...result, toolUseId: toolCall.id };
        resolve(r);
        this.emitResult(r);
      })
      .catch((error) => {
        const r: ToolResult = {
          toolUseId: toolCall.id,
          name: toolCall.function.name,
          result: '',
          error: error instanceof Error ? error.message : String(error),
          isError: true,
        };
        resolve(r);
        this.emitResult(r);
      });

    return promise;
  }

  async waitForAll(): Promise<ToolResult[]> {
    const results = await Promise.all(
      Array.from(this.pendingResults.values()).map((p) => p.promise),
    );
    return results;
  }

  discard(): void {
    this.resultCallback = null;
    this.pendingResults.clear();
  }

  private emitResult(result: ToolResult): void {
    this.resultCallback?.(result);
  }
}
```

- [ ] **Step 4: Run all tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
cd c:/Users/rap/mimo-code/mimo-code
git add src/services/tools/StreamingToolExecutor.ts tests/unit/query/streaming-tools.test.ts
git commit -m "feat(tools): add Promise-based tracking to StreamingToolExecutor"
```

---

## Task 4: Token Budget Management

**Files:**
- Create: `src/query/tokenBudget.ts`
- Modify: `src/query.ts`
- Test: `tests/unit/query/tokenBudget.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/query/tokenBudget.test.ts
import { describe, it, expect } from 'vitest';
import { TokenBudget } from '../../../src/query/tokenBudget.js';

describe('TokenBudget', () => {
  it('tracks token usage across turns', () => {
    const budget = new TokenBudget(8000);
    budget.recordTurn({ inputTokens: 1000, outputTokens: 500 });
    expect(budget.totalUsed).toBe(1500);
    expect(budget.remaining).toBe(6500);
  });

  it('returns true for shouldContinue when under threshold', () => {
    const budget = new TokenBudget(8000);
    budget.recordTurn({ inputTokens: 3000, outputTokens: 1000 });
    expect(budget.shouldContinue()).toBe(true);
  });

  it('returns false for shouldContinue when over 90% threshold', () => {
    const budget = new TokenBudget(100);
    budget.recordTurn({ inputTokens: 50, outputTokens: 45 });
    expect(budget.shouldContinue()).toBe(false);
  });

  it('detects diminishing returns after 3 low-increment turns', () => {
    const budget = new TokenBudget(8000);
    budget.recordTurn({ inputTokens: 100, outputTokens: 100 });
    budget.recordTurn({ inputTokens: 100, outputTokens: 100 });
    budget.recordTurn({ inputTokens: 100, outputTokens: 100 });
    expect(budget.hasDiminishingReturns()).toBe(true);
  });

  it('does not flag diminishing returns if increments are large', () => {
    const budget = new TokenBudget(8000);
    budget.recordTurn({ inputTokens: 1000, outputTokens: 1000 });
    budget.recordTurn({ inputTokens: 1000, outputTokens: 1000 });
    budget.recordTurn({ inputTokens: 1000, outputTokens: 1000 });
    expect(budget.hasDiminishingReturns()).toBe(false);
  });

  it('resets diminishing returns counter on large increment', () => {
    const budget = new TokenBudget(8000);
    budget.recordTurn({ inputTokens: 100, outputTokens: 100 });
    budget.recordTurn({ inputTokens: 100, outputTokens: 100 });
    budget.recordTurn({ inputTokens: 2000, outputTokens: 1000 }); // large
    budget.recordTurn({ inputTokens: 100, outputTokens: 100 });
    expect(budget.hasDiminishingReturns()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/query/tokenBudget.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement TokenBudget**

```ts
// src/query/tokenBudget.ts
import type { TokenUsage } from '../types/message.js';

const DIMINISHING_THRESHOLD = 500;
const DIMINISHING_COUNT = 3;
const CONTINUE_THRESHOLD = 0.9;

export class TokenBudget {
  readonly maxTokens: number;
  private used = 0;
  private lowIncrementCount = 0;

  constructor(maxTokens: number) {
    this.maxTokens = maxTokens;
  }

  get totalUsed(): number {
    return this.used;
  }

  get remaining(): number {
    return Math.max(0, this.maxTokens - this.used);
  }

  get usageRatio(): number {
    return this.maxTokens > 0 ? this.used / this.maxTokens : 1;
  }

  recordTurn(usage: TokenUsage): void {
    const turnTotal = usage.inputTokens + usage.outputTokens;
    this.used += turnTotal;

    if (turnTotal < DIMINISHING_THRESHOLD) {
      this.lowIncrementCount++;
    } else {
      this.lowIncrementCount = 0;
    }
  }

  shouldContinue(): boolean {
    return this.usageRatio < CONTINUE_THRESHOLD;
  }

  hasDiminishingReturns(): boolean {
    return this.lowIncrementCount >= DIMINISHING_COUNT;
  }

  shouldCompress(): boolean {
    return this.usageRatio >= 0.8;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/query/tokenBudget.test.ts`
Expected: PASS

- [ ] **Step 5: Integrate into query.ts**

Add token budget to `QueryDeps` and use it in the query loop:

```ts
// In src/query.ts — add to QueryDeps:
export interface QueryDeps {
  callModel: (request: ModelRequest) => AsyncGenerator<StreamChunk>;
  microcompact: (messages: Message[]) => Message[];
  autocompact: (messages: Message[]) => Promise<Message[]>;
  uuid: () => string;
  getTool: (name: string) => Tool | undefined;
  toolContext: ToolUseContext;
  tokenBudget?: import('./query/tokenBudget.js').TokenBudget;  // NEW
}

// In queryLoop, after each turn:
// (after yielding assistantMessage)
if (deps.tokenBudget) {
  // Record usage from the stream chunk's usage field
  if (usage) {
    deps.tokenBudget.recordTurn(usage);
  }
  if (!deps.tokenBudget.shouldContinue()) {
    yield { role: 'assistant', content: '[Token budget exceeded — context compressed]' };
    return;
  }
  if (deps.tokenBudget.hasDiminishingReturns()) {
    return; // Stop — no meaningful progress
  }
  if (deps.tokenBudget.shouldCompress()) {
    messages = await deps.autocompact(messages);
  }
}
```

- [ ] **Step 6: Run all tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
cd c:/Users/rap/mimo-code/mimo-code
git add src/query/tokenBudget.ts src/query.ts tests/unit/query/tokenBudget.test.ts
git commit -m "feat(query): add token budget management with diminishing returns detection"
```

---

## Task 5: Tool Call Summarization

**Files:**
- Create: `src/services/tools/toolSummary.ts`
- Test: `tests/unit/tools/toolSummary.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/tools/toolSummary.test.ts
import { describe, it, expect } from 'vitest';
import { shouldSummarize, truncateToolOutput } from '../../../src/services/tools/toolSummary.js';

describe('shouldSummarize', () => {
  it('returns true for output over 5000 chars', () => {
    expect(shouldSummarize('x'.repeat(5001))).toBe(true);
  });

  it('returns false for output under 5000 chars', () => {
    expect(shouldSummarize('short output')).toBe(false);
  });
});

describe('truncateToolOutput', () => {
  it('keeps first 500 and last 500 chars with marker', () => {
    const input = 'a'.repeat(6000);
    const result = truncateToolOutput(input, 5000);
    expect(result.length).toBeLessThan(6000);
    expect(result.startsWith('a'.repeat(500))).toBe(true);
    expect(result.endsWith('a'.repeat(500))).toBe(true);
    expect(result).toContain('[...truncated...');
  });

  it('returns original if under limit', () => {
    const input = 'short';
    expect(truncateToolOutput(input, 5000)).toBe(input);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/tools/toolSummary.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement tool summary**

```ts
// src/services/tools/toolSummary.ts
const DEFAULT_MAX_LENGTH = 5000;
const DEFAULT_KEEP_CHARS = 500;

export function shouldSummarize(output: string, maxLength: number = DEFAULT_MAX_LENGTH): boolean {
  return output.length > maxLength;
}

export function truncateToolOutput(
  output: string,
  maxLength: number = DEFAULT_MAX_LENGTH,
  keepChars: number = DEFAULT_KEEP_CHARS,
): string {
  if (output.length <= maxLength) return output;

  const head = output.slice(0, keepChars);
  const tail = output.slice(-keepChars);
  const omitted = output.length - keepChars * 2;

  return `${head}\n\n[...truncated ${omitted} chars...]\n\n${tail}`;
}

export function summarizeToolOutput(
  output: string,
  maxLength: number = DEFAULT_MAX_LENGTH,
  keepChars: number = DEFAULT_KEEP_CHARS,
): string {
  if (!shouldSummarize(output, maxLength)) return output;
  return truncateToolOutput(output, maxLength, keepChars);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/tools/toolSummary.test.ts`
Expected: PASS

- [ ] **Step 5: Integrate into query.ts tool execution**

In `src/query.ts`, after executing a tool, summarize the output:

```ts
import { summarizeToolOutput } from './services/tools/toolSummary.js';

// In the tool execution loop:
const result = await runToolUse(tool, args, contextWithMessages);
const content = result.error && result.isError ? result.error : result.result;
const summarized = summarizeToolOutput(content);  // NEW
messages = [...messages, { role: 'tool', content: summarized, toolCallId: tc.id }];
```

- [ ] **Step 6: Run all tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
cd c:/Users/rap/mimo-code/mimo-code
git add src/services/tools/toolSummary.ts src/query.ts tests/unit/tools/toolSummary.test.ts
git commit -m "feat(tools): add tool output summarization with truncation"
```

---

## Task 6: History Persistence

**Files:**
- Create: `src/history/types.ts`
- Create: `src/history/store.ts`
- Create: `src/commands/resume.ts`
- Modify: `src/screens/REPL.tsx`
- Test: `tests/unit/history/store.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/history/store.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HistoryStore } from '../../../src/history/store.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('HistoryStore', () => {
  let tmpDir: string;
  let store: HistoryStore;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'mimo-test-'));
    store = new HistoryStore(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('saves and loads a session', async () => {
    await store.save({
      id: 'test-1',
      timestamp: Date.now(),
      model: 'mimo-large',
      messages: [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi there' },
      ],
      totalUsage: { inputTokens: 100, outputTokens: 50 },
    });

    const entries = await store.list();
    expect(entries).toHaveLength(1);
    expect(entries[0]!.id).toBe('test-1');
    expect(entries[0]!.model).toBe('mimo-large');
  });

  it('loads messages for a specific session', async () => {
    await store.save({
      id: 'test-2',
      timestamp: Date.now(),
      model: 'mimo-large',
      messages: [{ role: 'user', content: 'test' }],
      totalUsage: { inputTokens: 10, outputTokens: 5 },
    });

    const session = await store.load('test-2');
    expect(session).not.toBeNull();
    expect(session!.messages).toHaveLength(1);
  });

  it('returns null for non-existent session', async () => {
    const session = await store.load('nonexistent');
    expect(session).toBeNull();
  });

  it('limits to 100 entries', async () => {
    for (let i = 0; i < 105; i++) {
      await store.save({
        id: `test-${i}`,
        timestamp: Date.now() - (105 - i) * 1000,
        model: 'mimo-large',
        messages: [],
        totalUsage: { inputTokens: 0, outputTokens: 0 },
      });
    }

    const entries = await store.list();
    expect(entries.length).toBeLessThanOrEqual(100);
  });

  it('deletes a session', async () => {
    await store.save({
      id: 'test-del',
      timestamp: Date.now(),
      model: 'mimo-large',
      messages: [],
      totalUsage: { inputTokens: 0, outputTokens: 0 },
    });

    await store.delete('test-del');
    const session = await store.load('test-del');
    expect(session).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/history/store.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement history types**

```ts
// src/history/types.ts
import type { Message, TokenUsage } from '../types/message.js';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  model: string;
  messages: Message[];
  totalUsage: TokenUsage;
}

export interface HistoryIndex {
  entries: Array<{
    id: string;
    timestamp: number;
    model: string;
    messageCount: number;
    preview: string;
  }>;
}
```

- [ ] **Step 4: Implement history store**

```ts
// src/history/store.ts
import { readFile, writeFile, mkdir, readdir, unlink, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { HistoryEntry, HistoryIndex } from './types.js';

const MAX_ENTRIES = 100;

export class HistoryStore {
  private dir: string;

  constructor(baseDir: string) {
    this.dir = baseDir;
  }

  async init(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  async save(entry: HistoryEntry): Promise<void> {
    await this.init();
    const filePath = join(this.dir, `${entry.id}.json`);
    await writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
    await this.prune();
  }

  async load(id: string): Promise<HistoryEntry | null> {
    try {
      const filePath = join(this.dir, `${id}.json`);
      const data = await readFile(filePath, 'utf-8');
      return JSON.parse(data) as HistoryEntry;
    } catch {
      return null;
    }
  }

  async list(): Promise<HistoryIndex['entries']> {
    try {
      await this.init();
      const files = await readdir(this.dir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      const entries: HistoryIndex['entries'] = [];
      for (const file of jsonFiles) {
        try {
          const data = await readFile(join(this.dir, file), 'utf-8');
          const entry = JSON.parse(data) as HistoryEntry;
          const preview = entry.messages
            .filter((m) => m.role === 'user')
            .map((m) => (typeof m.content === 'string' ? m.content : '[complex]'))
            .slice(0, 2)
            .join(' ');

          entries.push({
            id: entry.id,
            timestamp: entry.timestamp,
            model: entry.model,
            messageCount: entry.messages.length,
            preview: preview.slice(0, 100),
          });
        } catch {
          // Skip corrupted files
        }
      }

      return entries.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const filePath = join(this.dir, `${id}.json`);
      await unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  private async prune(): Promise<void> {
    const entries = await this.list();
    if (entries.length > MAX_ENTRIES) {
      const toRemove = entries.slice(MAX_ENTRIES);
      for (const entry of toRemove) {
        await this.delete(entry.id);
      }
    }
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/history/store.test.ts`
Expected: PASS

- [ ] **Step 6: Create /resume command**

```ts
// src/commands/resume.ts
import type { Command } from '../commands.js';
import type { HistoryStore } from '../history/store.js';

export function createResumeCommand(historyStore: HistoryStore): Command {
  return {
    name: 'resume',
    aliases: ['r'],
    description: 'Resume a previous conversation',
    isEnabled: () => true,
    call: async (args) => {
      const entries = await historyStore.list();
      if (entries.length === 0) {
        return 'No conversation history found.';
      }

      if (args.trim()) {
        const id = args.trim();
        const session = await historyStore.load(id);
        if (!session) {
          return `Session "${id}" not found.`;
        }
        return `Resumed session ${id} with ${session.messages.length} messages.`;
      }

      const lines = ['Recent conversations:'];
      for (const entry of entries.slice(0, 10)) {
        const date = new Date(entry.timestamp).toLocaleString();
        lines.push(`  ${entry.id} [${date}] ${entry.model} — ${entry.messageCount} msgs — "${entry.preview}"`);
      }
      lines.push('\nUsage: /resume <id>');
      return lines.join('\n');
    },
  };
}
```

- [ ] **Step 7: Run all tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
cd c:/Users/rap/mimo-code/mimo-code
git add src/history/ src/commands/resume.ts tests/unit/history/store.test.ts
git commit -m "feat(history): add conversation history persistence with /resume command"
```

---

## Task 7: Final Integration

- [ ] **Step 1: Run full test suite**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run typecheck**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx tsc --noEmit 2>&1 | grep -v "TS6133"`
Expected: No new errors

- [ ] **Step 3: Manual smoke test**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx tsx src/entrypoints/cli.tsx --help`
Expected: Help text shows all options including mode

- [ ] **Step 4: Final commit**

```bash
cd c:/Users/rap/mimo-code/mimo-code
git add -A
git commit -m "feat: Phase 1 complete — single/pipe mode, streaming tools, token budget, tool summary, history"
```
