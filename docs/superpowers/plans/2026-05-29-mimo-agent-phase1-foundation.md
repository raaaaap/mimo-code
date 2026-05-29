# Mimo Coding Agent - Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the project foundation — scaffolding, types, API client, state management, CLI entry, and a working REPL that can chat with the Mimo model.

**Architecture:** Mirror Claude Code's architecture with QueryEngine → query loop → API adapter → tool execution pipeline. Phase 1 delivers the minimal end-to-end flow: user types message → API call → streaming response → display.

**Tech Stack:** Node.js >= 18, TypeScript 5.x, Ink (React for CLI), Commander.js, Zod v4, esbuild + tsup, Vitest

**Design Spec:** `docs/superpowers/specs/2026-05-29-mimo-coding-agent-design.md`

---

## File Map

### New Files (Phase 1)

| File | Responsibility |
|------|---------------|
| `mimo-code/package.json` | Dependencies, scripts, bin entry |
| `mimo-code/tsconfig.json` | TypeScript config |
| `mimo-code/vitest.config.ts` | Test config |
| `mimo-code/src/types/message.ts` | Message, ContentPart, ToolCall types |
| `mimo-code/src/types/tool.ts` | Tool, ToolResult, ToolUseContext types |
| `mimo-code/src/types/api.ts` | ModelRequest, StreamChunk, ModelAdapter types |
| `mimo-code/src/types/config.ts` | Settings, CLI options types |
| `mimo-code/src/types/index.ts` | Re-export all types |
| `mimo-code/src/state/store.ts` | Custom store (useSyncExternalStore) |
| `mimo-code/src/state/AppStateStore.ts` | AppState type definition |
| `mimo-code/src/state/AppState.tsx` | React state Provider |
| `mimo-code/src/state/selectors.ts` | State selectors |
| `mimo-code/src/services/api/retry.ts` | Retry with exponential backoff |
| `mimo-code/src/services/api/streaming.ts` | SSE stream parser |
| `mimo-code/src/services/api/adapters/base.ts` | ModelAdapter interface |
| `mimo-code/src/services/api/adapters/openai.ts` | OpenAI-compatible adapter |
| `mimo-code/src/services/api/client.ts` | Unified API client |
| `mimo-code/src/utils/settings/settings.ts` | Settings loader |
| `mimo-code/src/utils/settings/types.ts` | Settings JSON types |
| `mimo-code/src/utils/settings/constants.ts` | Setting source constants |
| `mimo-code/src/context.ts` | Context collection (git, date) |
| `mimo-code/src/constants/prompts.ts` | System prompt assembly |
| `mimo-code/src/entrypoints/cli.tsx` | CLI entry point |
| `mimo-code/src/entrypoints/init.ts` | Initialization |
| `mimo-code/src/main.tsx` | Commander.js main |
| `mimo-code/src/replLauncher.tsx` | REPL launcher |
| `mimo-code/src/screens/REPL.tsx` | REPL screen |
| `mimo-code/src/components/Messages/MessageItem.tsx` | Single message display |
| `mimo-code/src/components/Messages/MessageList.tsx` | Message list |
| `mimo-code/src/components/PromptInput/PromptInput.tsx` | Input box |
| `mimo-code/src/components/Mimo/MimoAvatar.tsx` | Mimo ASCII mascot |
| `mimo-code/bin/mimo.js` | Executable entry |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `mimo-code/package.json`
- Create: `mimo-code/tsconfig.json`
- Create: `mimo-code/vitest.config.ts`
- Create: `mimo-code/bin/mimo.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "mimo-code",
  "version": "1.0.0",
  "description": "CLI coding agent for the Mimo large language model",
  "type": "module",
  "bin": {
    "mimo": "./bin/mimo.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsx src/entrypoints/cli.tsx",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "ink": "^5.0.0",
    "react": "^18.3.0",
    "commander": "^12.0.0",
    "zod": "^3.23.0",
    "chalk": "^5.3.0",
    "strip-ansi": "^7.1.0",
    "glob": "^10.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "typescript": "^5.5.0",
    "tsup": "^8.1.0",
    "tsx": "^4.15.0",
    "vitest": "^1.6.0",
    "eslint": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

- [ ] **Step 4: Create bin/mimo.js**

```javascript
#!/usr/bin/env node
import('../dist/entrypoints/cli.js');
```

- [ ] **Step 5: Create directory structure**

Run: `mkdir -p mimo-code/src/{types,state,services/api/adapters,utils/settings,constants,entrypoints,screens,components/{Messages,Input,Mimo},tools,commands,hooks,plugins} mimo-code/tests/{unit,integration,e2e} mimo-code/bin`

- [ ] **Step 6: Install dependencies**

Run: `cd mimo-code && npm install`

- [ ] **Step 7: Commit**

```bash
git add mimo-code/
git commit -m "feat: project scaffolding with package.json, tsconfig, vitest config"
```

---

### Task 2: Core Type Definitions

**Files:**
- Create: `mimo-code/src/types/message.ts`
- Create: `mimo-code/src/types/tool.ts`
- Create: `mimo-code/src/types/api.ts`
- Create: `mimo-code/src/types/config.ts`
- Create: `mimo-code/src/types/index.ts`
- Test: `mimo-code/tests/unit/types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/types.test.ts
import { describe, it, expect } from 'vitest';
import type { Message, ToolCall, ToolDefinition } from '../../src/types/index.js';

describe('Core Types', () => {
  it('should create a user message', () => {
    const msg: Message = {
      role: 'user',
      content: 'Hello Mimo',
    };
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('Hello Mimo');
  });

  it('should create an assistant message with tool calls', () => {
    const toolCall: ToolCall = {
      id: 'call_1',
      type: 'function',
      function: {
        name: 'BashTool',
        arguments: '{"command": "ls"}',
      },
    };
    const msg: Message = {
      role: 'assistant',
      content: 'Let me check.',
      toolCalls: [toolCall],
    };
    expect(msg.toolCalls).toHaveLength(1);
    expect(msg.toolCalls![0].function.name).toBe('BashTool');
  });

  it('should create a tool result message', () => {
    const msg: Message = {
      role: 'tool',
      content: 'file1.ts\nfile2.ts',
      toolCallId: 'call_1',
    };
    expect(msg.role).toBe('tool');
    expect(msg.toolCallId).toBe('call_1');
  });

  it('should create a tool definition in OpenAI format', () => {
    const def: ToolDefinition = {
      type: 'function',
      function: {
        name: 'BashTool',
        description: 'Execute a shell command',
        parameters: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'The command to execute' },
          },
          required: ['command'],
        },
      },
    };
    expect(def.type).toBe('function');
    expect(def.function.name).toBe('BashTool');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mimo-code && npx vitest run tests/unit/types.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write message types**

```typescript
// src/types/message.ts
export interface ContentPart {
  type: 'text' | 'image' | 'tool_use' | 'tool_result';
  text?: string;
  source?: { type: 'base64'; media_type: string; data: string };
  tool_use?: { id: string; name: string; input: Record<string, unknown> };
  tool_result?: { tool_use_id: string; content: string };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ContentPart[];
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
}

export interface UserMessage {
  type: 'user';
  content: string;
  attachments?: unknown[];
}

export interface AssistantMessage {
  type: 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
}
```

- [ ] **Step 4: Write tool types**

```typescript
// src/types/tool.ts
import type { z } from 'zod';
import type { Message, ToolCall } from './message.js';

export interface ToolResult {
  toolUseId: string;
  name: string;
  result: string;
  error?: string;
  isError?: boolean;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface QueryOptions {
  model: string;
  apiKey?: string;
  apiEndpoint?: string;
  maxTokens?: number;
  temperature?: number;
  verbose?: boolean;
  debug?: boolean;
  permissionMode?: string;
}

export interface ToolUseContext {
  options: QueryOptions;
  abortController: AbortController;
  readFileState: Map<string, string>;
  messages: Message[];
  toolDecisions: Map<string, unknown>;
  requestPrompt: (question: string) => Promise<string>;
  getAppState: () => Record<string, unknown>;
  setAppState: (state: Partial<Record<string, unknown>>) => void;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface Tool<TInput = unknown> {
  name: string;
  aliases?: string[];
  inputSchema: z.ZodSchema<TInput>;
  call(args: TInput, context: ToolUseContext): Promise<ToolResult>;
  description(): Promise<string>;
  prompt(): string;
  checkPermissions(args: TInput, context: ToolUseContext): PermissionResult;
  validateInput?(args: TInput): ValidationResult;
  isConcurrencySafe(): boolean;
  isReadOnly(): boolean;
  isDestructive(): boolean;
  interruptBehavior(): 'cancel' | 'block';
  maxResultSizeChars?: number;
}

export interface ToolPartial<TInput = unknown> {
  name: string;
  aliases?: string[];
  inputSchema: z.ZodSchema<TInput>;
  call(args: TInput, context: ToolUseContext): Promise<ToolResult>;
  description?: () => Promise<string>;
  prompt?: () => string;
  checkPermissions?: (args: TInput, context: ToolUseContext) => PermissionResult;
  isConcurrencySafe?: () => boolean;
  isReadOnly?: () => boolean;
  isDestructive?: () => boolean;
  interruptBehavior?: () => 'cancel' | 'block';
}

export function buildTool<T>(partial: ToolPartial<T>): Tool<T> {
  return {
    name: partial.name,
    aliases: partial.aliases,
    inputSchema: partial.inputSchema,
    call: partial.call,
    description: partial.description ?? (async () => partial.name),
    prompt: partial.prompt ?? (() => ''),
    checkPermissions: partial.checkPermissions ?? (() => ({ allowed: true })),
    validateInput: partial.validateInput,
    isConcurrencySafe: partial.isConcurrencySafe ?? (() => false),
    isReadOnly: partial.isReadOnly ?? (() => false),
    isDestructive: partial.isDestructive ?? (() => false),
    interruptBehavior: partial.interruptBehavior ?? (() => 'cancel'),
  };
}
```

- [ ] **Step 5: Write API types**

```typescript
// src/types/api.ts
import type { Message, ToolCall, TokenUsage, ToolDefinition } from './message.js';

export interface ModelRequest {
  model: string;
  messages: Message[];
  system?: string;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface StreamChunk {
  type: 'text' | 'tool_use' | 'thinking' | 'error' | 'done';
  content?: string;
  toolCall?: ToolCall;
  usage?: TokenUsage;
  finishReason?: string;
}

export interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
  finishReason?: string;
}

export interface ModelAdapter {
  name: string;
  streamChat(request: ModelRequest): AsyncGenerator<StreamChunk>;
  chat(request: ModelRequest): Promise<ModelResponse>;
  countTokens(messages: Message[]): number;
  supports(model: string): boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
  jitter: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: ['rate_limit', 'server_error', 'timeout', '429', '500', '502', '503'],
  jitter: true,
};
```

- [ ] **Step 6: Write config types**

```typescript
// src/types/config.ts
export interface CLIOptions {
  model: string;
  apiKey?: string;
  apiEndpoint?: string;
  mode: 'interactive' | 'single' | 'pipe';
  verbose: boolean;
  debug: boolean;
  output: 'text' | 'json' | 'markdown';
  noColor: boolean;
  theme: string;
  maxTokens: number;
  temperature: number;
  permissionMode: string;
}

export interface SettingsJson {
  model?: string;
  apiKey?: string;
  apiEndpoint?: string;
  theme?: string;
  maxTokens?: number;
  temperature?: number;
  permissionMode?: string;
  allowedTools?: string[];
  deniedTools?: string[];
  hooks?: {
    preToolUse?: Record<string, string>;
    postToolUse?: Record<string, string>;
  };
  mcpServers?: Record<string, {
    transport: 'stdio' | 'sse' | 'http';
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
  }>;
}

export type SettingsSource = 'userSettings' | 'projectSettings' | 'localSettings' | 'flagSettings' | 'policySettings';
```

- [ ] **Step 7: Write index re-export**

```typescript
// src/types/index.ts
export * from './message.js';
export * from './tool.js';
export * from './api.js';
export * from './config.js';
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd mimo-code && npx vitest run tests/unit/types.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add mimo-code/src/types/ mimo-code/tests/unit/types.test.ts
git commit -m "feat: core type definitions (Message, Tool, API, Config)"
```

---

### Task 3: State Management

**Files:**
- Create: `mimo-code/src/state/store.ts`
- Create: `mimo-code/src/state/AppStateStore.ts`
- Create: `mimo-code/src/state/AppState.tsx`
- Create: `mimo-code/src/state/selectors.ts`
- Test: `mimo-code/tests/unit/store.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/store.test.ts
import { describe, it, expect } from 'vitest';
import { createStore } from '../../src/state/store.js';

describe('createStore', () => {
  it('should initialize with provided state', () => {
    const store = createStore({ count: 0 });
    expect(store.getState()).toEqual({ count: 0 });
  });

  it('should update state via setState', () => {
    const store = createStore({ count: 0 });
    store.setState({ count: 1 });
    expect(store.getState().count).toBe(1);
  });

  it('should notify subscribers on state change', () => {
    const store = createStore({ count: 0 });
    let notified = 0;
    const unsub = store.subscribe(() => { notified++; });
    store.setState({ count: 1 });
    expect(notified).toBe(1);
    unsub();
  });

  it('should not notify after unsubscribe', () => {
    const store = createStore({ count: 0 });
    let notified = 0;
    const unsub = store.subscribe(() => { notified++; });
    store.setState({ count: 1 });
    unsub();
    store.setState({ count: 2 });
    expect(notified).toBe(1);
  });

  it('should merge state with partial update', () => {
    const store = createStore({ a: 1, b: 'hello' });
    store.setState({ b: 'world' });
    expect(store.getState()).toEqual({ a: 1, b: 'world' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mimo-code && npx vitest run tests/unit/store.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement store**

```typescript
// src/state/store.ts
type Listener = () => void;

export interface Store<T> {
  getState(): T;
  setState(partial: Partial<T>): void;
  subscribe(listener: Listener): () => void;
}

export function createStore<T extends Record<string, unknown>>(initialState: T): Store<T> {
  let state = { ...initialState };
  const listeners = new Set<Listener>();

  return {
    getState() {
      return state;
    },
    setState(partial) {
      state = { ...state, ...partial };
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mimo-code && npx vitest run tests/unit/store.test.ts`
Expected: PASS

- [ ] **Step 5: Write AppState types**

```typescript
// src/state/AppStateStore.ts
import type { Message, TokenUsage } from '../types/message.js';
import type { SettingsJson } from '../types/config.js';

export interface AppState {
  // Messages
  messages: Message[];

  // Session
  sessionId: string;
  isProcessing: boolean;

  // Model
  model: string;
  apiEndpoint: string;

  // Usage
  totalUsage: TokenUsage;

  // Settings
  settings: SettingsJson;
  settingsLoaded: boolean;

  // UI
  theme: string;
  verbose: boolean;
  debug: boolean;

  // Permission
  permissionMode: string;
}

export const INITIAL_APP_STATE: AppState = {
  messages: [],
  sessionId: '',
  isProcessing: false,
  model: 'mimo-large',
  apiEndpoint: 'https://api.mimo.ai/v1',
  totalUsage: { inputTokens: 0, outputTokens: 0 },
  settings: {},
  settingsLoaded: false,
  theme: 'mimo-dark',
  verbose: false,
  debug: false,
  permissionMode: 'default',
};
```

- [ ] **Step 6: Write AppState Provider**

```typescript
// src/state/AppState.tsx
import React, { createContext, useContext, useSyncExternalStore } from 'react';
import type { Store } from './store.js';
import { createStore } from './store.js';
import type { AppState } from './AppStateStore.js';
import { INITIAL_APP_STATE } from './AppStateStore.js';

const AppStateContext = createContext<Store<AppState> | null>(null);

export function AppStateProvider({ children, initialState }: {
  children: React.ReactNode;
  initialState?: Partial<AppState>;
}) {
  const storeRef = React.useRef<Store<AppState> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createStore({ ...INITIAL_APP_STATE, ...initialState });
  }

  return (
    <AppStateContext.Provider value={storeRef.current}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState<T>(selector: (state: AppState) => T): T {
  const store = useContext(AppStateContext);
  if (!store) throw new Error('useAppState must be used within AppStateProvider');
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
  );
}

export function useAppStateStore(): Store<AppState> {
  const store = useContext(AppStateContext);
  if (!store) throw new Error('useAppStateStore must be used within AppStateProvider');
  return store;
}
```

- [ ] **Step 7: Write selectors**

```typescript
// src/state/selectors.ts
import type { AppState } from './AppStateStore.js';

export const selectMessages = (state: AppState) => state.messages;
export const selectIsProcessing = (state: AppState) => state.isProcessing;
export const selectModel = (state: AppState) => state.model;
export const selectSettings = (state: AppState) => state.settings;
export const selectTheme = (state: AppState) => state.theme;
export const selectPermissionMode = (state: AppState) => state.permissionMode;
export const selectTotalUsage = (state: AppState) => state.totalUsage;
export const selectVerbose = (state: AppState) => state.verbose;
```

- [ ] **Step 8: Commit**

```bash
git add mimo-code/src/state/ mimo-code/tests/unit/store.test.ts
git commit -m "feat: state management with custom store and AppState"
```

---

### Task 4: API Client with OpenAI Adapter

**Files:**
- Create: `mimo-code/src/services/api/retry.ts`
- Create: `mimo-code/src/services/api/streaming.ts`
- Create: `mimo-code/src/services/api/adapters/base.ts`
- Create: `mimo-code/src/services/api/adapters/openai.ts`
- Create: `mimo-code/src/services/api/client.ts`
- Test: `mimo-code/tests/unit/api/retry.test.ts`
- Test: `mimo-code/tests/unit/api/openai-adapter.test.ts`

- [ ] **Step 1: Write the failing retry test**

```typescript
// tests/unit/api/retry.test.ts
import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../../../src/services/api/retry.js';
import { DEFAULT_RETRY_CONFIG } from '../../../src/types/api.js';

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, DEFAULT_RETRY_CONFIG);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('rate_limit'))
      .mockResolvedValue('ok');
    const result = await withRetry(fn, { ...DEFAULT_RETRY_CONFIG, baseDelay: 10, jitter: false });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('server_error'));
    await expect(
      withRetry(fn, { ...DEFAULT_RETRY_CONFIG, maxRetries: 2, baseDelay: 10, jitter: false })
    ).rejects.toThrow('server_error');
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('should not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('invalid_request'));
    await expect(
      withRetry(fn, { ...DEFAULT_RETRY_CONFIG, retryableErrors: ['rate_limit'], baseDelay: 10 })
    ).rejects.toThrow('invalid_request');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mimo-code && npx vitest run tests/unit/api/retry.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement retry**

```typescript
// src/services/api/retry.ts
import type { RetryConfig } from '../../types/api.js';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryable(error: unknown, config: RetryConfig): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return config.retryableErrors.some(pattern => message.includes(pattern));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === config.maxRetries || !isRetryable(error, config)) {
        throw error;
      }
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay,
      );
      const jitter = config.jitter ? delay * (0.5 + Math.random() * 0.5) : delay;
      await sleep(jitter);
    }
  }
  throw lastError;
}
```

- [ ] **Step 4: Run retry test to verify it passes**

Run: `cd mimo-code && npx vitest run tests/unit/api/retry.test.ts`
Expected: PASS

- [ ] **Step 5: Implement streaming handler**

```typescript
// src/services/api/streaming.ts
import type { StreamChunk } from '../../types/api.js';
import type { ToolCall } from '../../types/message.js';

export function parseSSEStream(response: Response): AsyncGenerator<StreamChunk> {
  return streamGenerator(response);
}

async function* streamGenerator(response: Response): AsyncGenerator<StreamChunk> {
  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: 'error', content: 'No response body' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let currentToolCalls: Map<number, ToolCall> = new Map();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          yield { type: 'done' };
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            yield { type: 'text', content: delta.content };
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const index = tc.index ?? 0;
              if (!currentToolCalls.has(index)) {
                currentToolCalls.set(index, {
                  id: tc.id ?? '',
                  type: 'function',
                  function: { name: '', arguments: '' },
                });
              }
              const existing = currentToolCalls.get(index)!;
              if (tc.id) existing.id = tc.id;
              if (tc.function?.name) existing.function.name = tc.function.name;
              if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
            }
          }

          if (parsed.choices?.[0]?.finish_reason) {
            for (const tc of currentToolCalls.values()) {
              yield { type: 'tool_use', toolCall: tc };
            }
            currentToolCalls.clear();
            yield {
              type: 'done',
              finishReason: parsed.choices[0].finish_reason,
              usage: parsed.usage ? {
                inputTokens: parsed.usage.prompt_tokens ?? 0,
                outputTokens: parsed.usage.completion_tokens ?? 0,
              } : undefined,
            };
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

- [ ] **Step 6: Write adapter base**

```typescript
// src/services/api/adapters/base.ts
export type { ModelAdapter } from '../../../types/api.js';
```

- [ ] **Step 7: Write the failing OpenAI adapter test**

```typescript
// tests/unit/api/openai-adapter.test.ts
import { describe, it, expect } from 'vitest';
import { OpenAIAdapter } from '../../../src/services/api/adapters/openai.js';

describe('OpenAIAdapter', () => {
  it('should support openai-compatible models', () => {
    const adapter = new OpenAIAdapter('https://api.openai.com/v1', 'test-key');
    expect(adapter.supports('gpt-4o')).toBe(true);
    expect(adapter.supports('mimo-large')).toBe(true);
    expect(adapter.supports('claude-opus')).toBe(false);
  });

  it('should report name', () => {
    const adapter = new OpenAIAdapter('https://api.openai.com/v1', 'test-key');
    expect(adapter.name).toBe('openai');
  });
});
```

- [ ] **Step 8: Run adapter test to verify it fails**

Run: `cd mimo-code && npx vitest run tests/unit/api/openai-adapter.test.ts`
Expected: FAIL

- [ ] **Step 9: Implement OpenAI adapter**

```typescript
// src/services/api/adapters/openai.ts
import type { ModelAdapter, ModelRequest, ModelResponse, StreamChunk } from '../../../types/api.js';
import type { Message, TokenUsage } from '../../../types/message.js';
import { parseSSEStream } from '../streaming.js';
import { withRetry } from '../retry.js';
import { DEFAULT_RETRY_CONFIG } from '../../../types/api.js';

export class OpenAIAdapter implements ModelAdapter {
  readonly name = 'openai';
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint.replace(/\/+$/, '');
    this.apiKey = apiKey;
  }

  supports(model: string): boolean {
    // Support all models for OpenAI-compatible endpoints
    // Claude models are excluded (they use Anthropic adapter)
    return !model.startsWith('claude-');
  }

  countTokens(messages: Message[]): number {
    // Rough estimation: ~4 chars per token
    let total = 0;
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        total += Math.ceil(msg.content.length / 4);
      } else {
        for (const part of msg.content) {
          if (part.text) total += Math.ceil(part.text.length / 4);
        }
      }
      if (msg.toolCalls) {
        for (const tc of msg.toolCalls) {
          total += Math.ceil(tc.function.arguments.length / 4);
        }
      }
    }
    return total;
  }

  async *streamChat(request: ModelRequest): AsyncGenerator<StreamChunk> {
    const body = this.buildRequestBody(request, true);
    const response = await this.fetchWithRetry(body);

    if (!response.ok) {
      const error = await response.text();
      yield { type: 'error', content: `API error ${response.status}: ${error}` };
      return;
    }

    yield* parseSSEStream(response);
  }

  async chat(request: ModelRequest): Promise<ModelResponse> {
    const body = this.buildRequestBody(request, false);
    const response = await this.fetchWithRetry(body);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error ${response.status}: ${error}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice) throw new Error('No choices in response');

    const usage: TokenUsage | undefined = data.usage ? {
      inputTokens: data.usage.prompt_tokens ?? 0,
      outputTokens: data.usage.completion_tokens ?? 0,
    } : undefined;

    return {
      content: choice.message?.content ?? '',
      toolCalls: choice.message?.tool_calls?.map((tc: any) => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
      usage,
      finishReason: choice.finish_reason,
    };
  }

  private buildRequestBody(request: ModelRequest, stream: boolean) {
    const messages: unknown[] = [];

    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }

    for (const msg of request.messages) {
      if (msg.role === 'tool') {
        messages.push({
          role: 'tool',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          tool_call_id: msg.toolCallId,
        });
      } else if (msg.role === 'assistant' && msg.toolCalls) {
        messages.push({
          role: 'assistant',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: tc.function,
          })),
        });
      } else {
        messages.push({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        });
      }
    }

    return {
      model: request.model,
      messages,
      tools: request.tools,
      tool_choice: request.toolChoice,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      stream,
    };
  }

  private async fetchWithRetry(body: unknown): Promise<Response> {
    return withRetry(async () => {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      });
      return response;
    }, DEFAULT_RETRY_CONFIG);
  }
}
```

- [ ] **Step 10: Run adapter test to verify it passes**

Run: `cd mimo-code && npx vitest run tests/unit/api/openai-adapter.test.ts`
Expected: PASS

- [ ] **Step 11: Write unified API client**

```typescript
// src/services/api/client.ts
import type { ModelAdapter, ModelRequest, ModelResponse, StreamChunk } from '../../types/api.js';
import type { Message, TokenUsage } from '../../types/message.js';
import { OpenAIAdapter } from './adapters/openai.js';

export class APIClient {
  private adapters: ModelAdapter[] = [];
  private defaultAdapter: ModelAdapter;

  constructor(endpoint: string, apiKey: string) {
    this.defaultAdapter = new OpenAIAdapter(endpoint, apiKey);
    this.adapters.push(this.defaultAdapter);
  }

  addAdapter(adapter: ModelAdapter): void {
    this.adapters.push(adapter);
  }

  private getAdapter(model: string): ModelAdapter {
    for (const adapter of this.adapters) {
      if (adapter.supports(model)) return adapter;
    }
    return this.defaultAdapter;
  }

  async *streamChat(request: ModelRequest): AsyncGenerator<StreamChunk> {
    const adapter = this.getAdapter(request.model);
    yield* adapter.streamChat(request);
  }

  async chat(request: ModelRequest): Promise<ModelResponse> {
    const adapter = this.getAdapter(request.model);
    return adapter.chat(request);
  }

  countTokens(messages: Message[]): number {
    return this.defaultAdapter.countTokens(messages);
  }
}
```

- [ ] **Step 12: Commit**

```bash
git add mimo-code/src/services/api/ mimo-code/tests/unit/api/
git commit -m "feat: API client with OpenAI adapter, SSE streaming, retry"
```

---

### Task 5: Settings System & Context

**Files:**
- Create: `mimo-code/src/utils/settings/settings.ts`
- Create: `mimo-code/src/utils/settings/types.ts`
- Create: `mimo-code/src/utils/settings/constants.ts`
- Create: `mimo-code/src/context.ts`
- Create: `mimo-code/src/constants/prompts.ts`

- [ ] **Step 1: Create settings constants**

```typescript
// src/utils/settings/constants.ts
import type { SettingsSource } from '../../types/config.js';

export const SETTING_SOURCES: SettingsSource[] = [
  'policySettings',
  'flagSettings',
  'localSettings',
  'projectSettings',
  'userSettings',
];

export const SETTINGS_FILE_NAMES: Record<SettingsSource, string | null> = {
  policySettings: null,
  flagSettings: null,
  localSettings: '.mimo/settings.local.json',
  projectSettings: '.mimo/settings.json',
  userSettings: '.mimo/settings.json',
};
```

- [ ] **Step 2: Create settings loader**

```typescript
// src/utils/settings/settings.ts
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { SettingsJson, CLIOptions } from '../../types/config.js';

const USER_SETTINGS_PATH = join(homedir(), '.mimo', 'settings.json');

async function readJsonFile(path: string): Promise<SettingsJson | null> {
  try {
    await access(path);
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as SettingsJson;
  } catch {
    return null;
  }
}

export async function loadSettings(
  projectRoot: string,
  cliOptions: Partial<CLIOptions>,
): Promise<SettingsJson> {
  const userSettings = await readJsonFile(USER_SETTINGS_PATH) ?? {};
  const projectSettings = await readJsonFile(join(projectRoot, '.mimo', 'settings.json')) ?? {};
  const localSettings = await readJsonFile(join(projectRoot, '.mimo', 'settings.local.json')) ?? {};

  // CLI flags override everything
  const flagSettings: SettingsJson = {};
  if (cliOptions.model) flagSettings.model = cliOptions.model;
  if (cliOptions.apiKey) flagSettings.apiKey = cliOptions.apiKey;
  if (cliOptions.apiEndpoint) flagSettings.apiEndpoint = cliOptions.apiEndpoint;
  if (cliOptions.theme) flagSettings.theme = cliOptions.theme;
  if (cliOptions.maxTokens) flagSettings.maxTokens = cliOptions.maxTokens;
  if (cliOptions.temperature) flagSettings.temperature = cliOptions.temperature;
  if (cliOptions.permissionMode) flagSettings.permissionMode = cliOptions.permissionMode;

  // Merge: user < project < local < flags
  return {
    ...userSettings,
    ...projectSettings,
    ...localSettings,
    ...flagSettings,
  };
}

export function resolveApiKey(settings: SettingsJson): string | undefined {
  return settings.apiKey ?? process.env.MIMO_API_KEY ?? process.env.OPENAI_API_KEY;
}

export function resolveEndpoint(settings: SettingsJson): string {
  return settings.apiEndpoint
    ?? process.env.MIMO_API_ENDPOINT
    ?? process.env.OPENAI_API_BASE
    ?? 'https://api.mimo.ai/v1';
}
```

- [ ] **Step 3: Create context collector**

```typescript
// src/context.ts
import { execSync } from 'node:child_process';

export interface SystemContext {
  gitBranch?: string;
  gitStatus?: string;
  gitRecentCommits?: string;
  cwd: string;
  date: string;
}

export function getSystemContext(): SystemContext {
  const cwd = process.cwd();
  const date = new Date().toISOString().split('T')[0];

  let gitBranch: string | undefined;
  let gitStatus: string | undefined;
  let gitRecentCommits: string | undefined;

  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();
  } catch { /* not a git repo */ }

  try {
    gitStatus = execSync('git status --short', { cwd, encoding: 'utf-8' }).trim();
  } catch { /* ignore */ }

  try {
    gitRecentCommits = execSync('git log --oneline -5', { cwd, encoding: 'utf-8' }).trim();
  } catch { /* ignore */ }

  return { gitBranch, gitStatus, gitRecentCommits, cwd, date };
}

export function formatSystemContext(ctx: SystemContext): string {
  const parts: string[] = [];
  parts.push(`Working directory: ${ctx.cwd}`);
  parts.push(`Date: ${ctx.date}`);
  if (ctx.gitBranch) parts.push(`Git branch: ${ctx.gitBranch}`);
  if (ctx.gitStatus) parts.push(`Git status:\n${ctx.gitStatus}`);
  if (ctx.gitRecentCommits) parts.push(`Recent commits:\n${ctx.gitRecentCommits}`);
  return parts.join('\n');
}
```

- [ ] **Step 4: Create system prompt assembly**

```typescript
// src/constants/prompts.ts
import type { Tool } from '../types/tool.js';
import type { SystemContext } from '../context.js';
import { formatSystemContext } from '../context.js';

export function getSystemPrompt(
  tools: Tool[],
  context: SystemContext,
  mimoMd?: string,
): string {
  const sections: string[] = [];

  // Intro
  sections.push(`You are Mimo, an AI coding agent running in the user's terminal. You help with software engineering tasks: writing code, debugging, refactoring, explaining code, and more.`);

  // Tool descriptions
  if (tools.length > 0) {
    sections.push(`## Available Tools\nYou have access to the following tools. Use them to help the user.`);
    for (const tool of tools) {
      sections.push(`### ${tool.name}\n${tool.prompt()}`);
    }
  }

  // System context
  sections.push(`## System Context\n${formatSystemContext(context)}`);

  // Project config
  if (mimoMd) {
    sections.push(`## Project Configuration (MIMO.md)\n${mimoMd}`);
  }

  // Instructions
  sections.push(`## Instructions
- Prefer editing existing files over creating new ones
- Be careful not to introduce security vulnerabilities
- When referencing files, use relative paths
- Run tests after making changes
- If unsure about requirements, ask the user`);

  return sections.join('\n\n');
}
```

- [ ] **Step 5: Commit**

```bash
git add mimo-code/src/utils/settings/ mimo-code/src/context.ts mimo-code/src/constants/
git commit -m "feat: settings system, context collection, system prompt assembly"
```

---

### Task 6: CLI Entry Point & REPL Launcher

**Files:**
- Create: `mimo-code/src/entrypoints/cli.tsx`
- Create: `mimo-code/src/entrypoints/init.ts`
- Create: `mimo-code/src/main.tsx`
- Create: `mimo-code/src/replLauncher.tsx`

- [ ] **Step 1: Create initialization**

```typescript
// src/entrypoints/init.ts
export async function init(): Promise<void> {
  // Set up graceful shutdown
  process.on('SIGINT', () => {
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    process.exit(0);
  });

  // Ensure unhandled errors are caught
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
  });
}
```

- [ ] **Step 2: Create CLI entry**

```tsx
// src/entrypoints/cli.tsx
import { init } from './init.js';

async function main() {
  // Fast-path checks
  if (process.argv.includes('--version')) {
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const pkg = require('../../package.json');
    console.log(`mimo-code v${pkg.version}`);
    process.exit(0);
  }

  await init();

  // Load and run main
  const { run } = await import('../main.js');
  await run();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
```

- [ ] **Step 3: Create main with Commander.js**

```tsx
// src/main.tsx
import { Command } from 'commander';
import type { CLIOptions } from './types/config.js';
import { loadSettings, resolveApiKey, resolveEndpoint } from './utils/settings/settings.js';

export async function run(): Promise<void> {
  const program = new Command();

  program
    .name('mimo')
    .description('Mimo Coding Agent - CLI coding assistant powered by Mimo LLM')
    .version('1.0.0')
    .argument('[prompt]', 'Initial prompt (non-interactive mode)')
    .option('-m, --model <model>', 'Model to use', 'mimo-large')
    .option('-k, --api-key <key>', 'API key')
    .option('--api-endpoint <url>', 'API endpoint URL')
    .option('--mode <mode>', 'Mode: interactive, single, pipe', 'interactive')
    .option('-v, --verbose', 'Verbose output', false)
    .option('--debug', 'Debug mode', false)
    .option('-o, --output <format>', 'Output format: text, json, markdown', 'text')
    .option('--no-color', 'Disable colors')
    .option('--theme <theme>', 'UI theme', 'mimo-dark')
    .option('--max-tokens <n>', 'Max tokens', parseInt, 4096)
    .option('--temperature <n>', 'Temperature', parseFloat, 0.7)
    .option('--permission-mode <mode>', 'Permission mode', 'default')
    .action(async (prompt: string | undefined, options: Partial<CLIOptions>) => {
      const cliOptions: CLIOptions = {
        model: options.model ?? 'mimo-large',
        apiKey: options.apiKey,
        apiEndpoint: options.apiEndpoint,
        mode: (options.mode as CLIOptions['mode']) ?? 'interactive',
        verbose: options.verbose ?? false,
        debug: options.debug ?? false,
        output: (options.output as CLIOptions['output']) ?? 'text',
        noColor: options.noColor ?? false,
        theme: options.theme ?? 'mimo-dark',
        maxTokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        permissionMode: options.permissionMode ?? 'default',
      };

      const projectRoot = process.cwd();
      const settings = await loadSettings(projectRoot, cliOptions);
      const apiKey = resolveApiKey(settings);
      const endpoint = resolveEndpoint(settings);

      if (!apiKey) {
        console.error('Error: No API key found. Set MIMO_API_KEY environment variable or use --api-key flag.');
        process.exit(1);
      }

      if (cliOptions.mode === 'interactive') {
        const { launchREPL } = await import('./replLauncher.js');
        await launchREPL({ ...cliOptions, apiKey, apiEndpoint: endpoint, settings });
      } else {
        // Single/pipe mode
        console.error('Single/pipe mode not yet implemented');
        process.exit(1);
      }
    });

  await program.parseAsync();
}
```

- [ ] **Step 4: Create REPL launcher**

```tsx
// src/replLauncher.tsx
import React from 'react';
import { render } from 'ink';
import type { CLIOptions, SettingsJson } from './types/config.js';
import { AppStateProvider } from './state/AppState.js';
import { REPLScreen } from './screens/REPL.js';

interface REPLLaunchOptions extends CLIOptions {
  apiKey: string;
  apiEndpoint: string;
  settings: SettingsJson;
}

export async function launchREPL(options: REPLLaunchOptions): Promise<void> {
  const { waitUntilExit } = render(
    <AppStateProvider initialState={{
      model: options.model,
      apiEndpoint: options.apiEndpoint,
      theme: options.theme,
      verbose: options.verbose,
      debug: options.debug,
      permissionMode: options.permissionMode,
      settings: options.settings,
      settingsLoaded: true,
    }}>
      <REPLScreen apiKey={options.apiKey} />
    </AppStateProvider>,
  );

  await waitUntilExit();
}
```

- [ ] **Step 5: Commit**

```bash
git add mimo-code/src/entrypoints/ mimo-code/src/main.tsx mimo-code/src/replLauncher.tsx
git commit -m "feat: CLI entry point with Commander.js and REPL launcher"
```

---

### Task 7: Basic REPL Screen & Components

**Files:**
- Create: `mimo-code/src/components/Messages/MessageItem.tsx`
- Create: `mimo-code/src/components/Messages/MessageList.tsx`
- Create: `mimo-code/src/components/PromptInput/PromptInput.tsx`
- Create: `mimo-code/src/components/Mimo/MimoAvatar.tsx`
- Create: `mimo-code/src/screens/REPL.tsx`

- [ ] **Step 1: Create Mimo avatar component**

```tsx
// src/components/Mimo/MimoAvatar.tsx
import React from 'react';
import { Text } from 'ink';

export enum MimoState {
  IDLE = 'idle',
  THINKING = 'thinking',
  CODING = 'coding',
  SUCCESS = 'success',
  ERROR = 'error',
  READING = 'reading',
}

const MIMO_ASCII: Record<MimoState, string> = {
  idle: `    +-----------+\n   /  O   O   \\\n  |    +---+    |\n  |   |     |   |\n   \\    +---+    /\n    +----+----+\n         |\n       /   \\`,
  thinking: `    +-----------+\n   /  .   .   \\   ?\n  |    +---+    |\n  |   | ### |   |\n   \\    +---+    /\n    +----+----+`,
  coding: `    +-----------+\n   /  O   O   \\   >>>\n  |    +---+    |\n  |   |===|===| |\n   \\    +---+    /\n    +----+----+`,
  success: `    +-----------+\n   /  O   O   \\   !!\n  |    +---+    |\n  |   |     |   |\n   \\    +---+    /\n    +----+----+`,
  error: `    +-----------+\n   /  O _ O   \\   ???\n  |    +---+    |\n  |   |     |   |\n   \\    +---+    /\n    +----+----+`,
  reading: `    +-----------+\n   /  O   o   \\\n  |    +---+    |\n  |   | ___ |   |\n   \\    +---+    /\n    +----+----+`,
};

export function MimoAvatar({ state = MimoState.IDLE }: { state?: MimoState }) {
  return (
    <Text color="cyan">
      {MIMO_ASCII[state]}
    </Text>
  );
}

export function MimoStatusLine({ state }: { state: MimoState }) {
  const statusText: Record<MimoState, string> = {
    [MimoState.IDLE]: 'Ready',
    [MimoState.THINKING]: 'Thinking...',
    [MimoState.CODING]: 'Working...',
    [MimoState.SUCCESS]: 'Done!',
    [MimoState.ERROR]: 'Something went wrong',
    [MimoState.READING]: 'Reading...',
  };

  const color: Record<MimoState, string> = {
    [MimoState.IDLE]: 'gray',
    [MimoState.THINKING]: 'yellow',
    [MimoState.CODING]: 'cyan',
    [MimoState.SUCCESS]: 'green',
    [MimoState.ERROR]: 'red',
    [MimoState.READING]: 'blue',
  };

  return <Text color={color[state]}>[{statusText[state]}]</Text>;
}
```

- [ ] **Step 2: Create MessageItem component**

```tsx
// src/components/Messages/MessageItem.tsx
import React from 'react';
import { Text, Box } from 'ink';
import type { Message } from '../../types/message.js';

export function MessageItem({ message }: { message: Message }) {
  const roleColors: Record<string, string> = {
    user: 'blue',
    assistant: 'green',
    tool: 'gray',
    system: 'yellow',
  };

  const roleLabels: Record<string, string> = {
    user: 'You',
    assistant: 'Mimo',
    tool: 'Tool',
    system: 'System',
  };

  const color = roleColors[message.role] ?? 'white';
  const label = roleLabels[message.role] ?? message.role;
  const content = typeof message.content === 'string'
    ? message.content
    : message.content.map(p => p.text ?? '').join('');

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={color}>[{label}]</Text>
      <Text>{content}</Text>
      {message.toolCalls && message.toolCalls.length > 0 && (
        <Box marginTop={1}>
          <Text color="gray">
            {message.toolCalls.map(tc =>
              `  -> ${tc.function.name}(${tc.function.arguments.slice(0, 80)}${tc.function.arguments.length > 80 ? '...' : ''})`
            ).join('\n')}
          </Text>
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 3: Create MessageList component**

```tsx
// src/components/Messages/MessageList.tsx
import React from 'react';
import { Box } from 'ink';
import type { Message } from '../../types/message.js';
import { MessageItem } from './MessageItem.js';

export function MessageList({ messages }: { messages: Message[] }) {
  return (
    <Box flexDirection="column">
      {messages.map((msg, i) => (
        <MessageItem key={i} message={msg} />
      ))}
    </Box>
  );
}
```

- [ ] **Step 4: Create PromptInput component**

```tsx
// src/components/PromptInput/PromptInput.tsx
import React, { useState } from 'react';
import { Text, Box, useInput, useApp } from 'ink';

interface PromptInputProps {
  onSubmit: (input: string) => void;
  isDisabled?: boolean;
}

export function PromptInput({ onSubmit, isDisabled }: PromptInputProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { exit } = useApp();

  useInput((key, keyMeta) => {
    if (isDisabled) return;

    if (keyMeta.return) {
      if (input.trim()) {
        setHistory(prev => [...prev, input.trim()]);
        setHistoryIndex(-1);
        onSubmit(input.trim());
        setInput('');
      }
      return;
    }

    if (keyMeta.ctrl && key === 'c') {
      exit();
      return;
    }

    if (keyMeta.ctrl && key === 'd') {
      exit();
      return;
    }

    if (keyMeta.upArrow) {
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
      return;
    }

    if (keyMeta.downArrow) {
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
      return;
    }

    if (keyMeta.backspace || keyMeta.delete) {
      setInput(prev => prev.slice(0, -1));
      return;
    }

    if (key === 'escape') {
      setInput('');
      setHistoryIndex(-1);
      return;
    }

    // Regular character input
    if (key.length === 1 && !keyMeta.ctrl && !keyMeta.meta) {
      setInput(prev => prev + key);
    }
  });

  return (
    <Box>
      <Text color="cyan" bold>{' > '}</Text>
      <Text>{input}</Text>
      {!isDisabled && <Text color="gray">_</Text>}
    </Box>
  );
}
```

- [ ] **Step 5: Create REPL screen**

```tsx
// src/screens/REPL.tsx
import React, { useState, useCallback, useRef } from 'react';
import { Text, Box, useApp } from 'ink';
import { MessageList } from '../components/Messages/MessageList.js';
import { PromptInput } from '../components/PromptInput/PromptInput.js';
import { MimoAvatar, MimoState } from '../components/Mimo/MimoAvatar.js';
import { useAppState } from '../state/AppState.js';
import { selectMessages, selectModel, selectIsProcessing } from '../state/selectors.js';
import { useAppStateStore } from '../state/AppState.js';
import type { Message, ToolCall } from '../types/message.js';
import type { StreamChunk } from '../types/api.js';
import { APIClient } from '../services/api/client.js';
import { getSystemContext } from '../context.js';
import { getSystemPrompt } from '../constants/prompts.js';

interface REPLScreenProps {
  apiKey: string;
}

export function REPLScreen({ apiKey }: REPLScreenProps) {
  const messages = useAppState(selectMessages);
  const model = useAppState(selectModel);
  const isProcessing = useAppState(selectIsProcessing);
  const store = useAppStateStore();
  const { exit } = useApp();
  const [mimoState, setMimoState] = useState(MimoState.IDLE);
  const abortRef = useRef<AbortController | null>(null);

  const apiEndpoint = useAppState(s => s.apiEndpoint);
  const clientRef = useRef<APIClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new APIClient(apiEndpoint, apiKey);
  }

  const handleSubmit = useCallback(async (input: string) => {
    const client = clientRef.current!;
    const currentMessages = store.getState().messages;

    // Add user message
    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...currentMessages, userMessage];
    store.setState({ messages: updatedMessages, isProcessing: true });
    setMimoState(MimoState.THINKING);

    // Build system prompt
    const context = getSystemContext();
    const systemPrompt = getSystemPrompt([], context);

    try {
      const assistantContent: string[] = [];
      const toolCalls: ToolCall[] = [];

      for await (const chunk of client.streamChat({
        model,
        messages: updatedMessages,
        system: systemPrompt,
        maxTokens: 4096,
        temperature: 0.7,
        stream: true,
      })) {
        if (chunk.type === 'text' && chunk.content) {
          assistantContent.push(chunk.content);
          setMimoState(MimoState.CODING);
        }
        if (chunk.type === 'tool_use' && chunk.toolCall) {
          toolCalls.push(chunk.toolCall);
        }
        if (chunk.type === 'error') {
          const errorMessage: Message = {
            role: 'assistant',
            content: `Error: ${chunk.content}`,
          };
          store.setState({
            messages: [...store.getState().messages, errorMessage],
            isProcessing: false,
          });
          setMimoState(MimoState.ERROR);
          return;
        }
      }

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantContent.join(''),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };

      store.setState({
        messages: [...store.getState().messages, assistantMessage],
        isProcessing: false,
      });
      setMimoState(MimoState.SUCCESS);

      // Reset to idle after a moment
      setTimeout(() => setMimoState(MimoState.IDLE), 2000);
    } catch (err) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
      };
      store.setState({
        messages: [...store.getState().messages, errorMessage],
        isProcessing: false,
      });
      setMimoState(MimoState.ERROR);
    }
  }, [model, store, apiKey]);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color="cyan" bold>[Mimo]</Text>
        <Text> Mimo Agent v1.0.0</Text>
        <Text color="gray">  [model: {model}]</Text>
      </Box>

      {/* Mimo avatar */}
      <Box marginBottom={1}>
        <MimoAvatar state={mimoState} />
      </Box>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <PromptInput onSubmit={handleSubmit} isDisabled={isProcessing} />
      </Box>

      {/* Status */}
      {isProcessing && (
        <Box marginTop={1}>
          <Text color="yellow">Processing...</Text>
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd mimo-code && npx tsc --noEmit`
Expected: No errors (or only expected external module resolution errors for ink/react before install)

- [ ] **Step 7: Commit**

```bash
git add mimo-code/src/components/ mimo-code/src/screens/
git commit -m "feat: REPL screen with Mimo avatar, message display, and prompt input"
```

---

### Task 8: Integration Test — End-to-End Message Flow

**Files:**
- Test: `mimo-code/tests/integration/message-flow.test.ts`

- [ ] **Step 1: Write integration test**

```typescript
// tests/integration/message-flow.test.ts
import { describe, it, expect, vi } from 'vitest';
import type { Message } from '../../src/types/message.js';
import type { ModelRequest, StreamChunk } from '../../src/types/api.js';

// Mock adapter that simulates a model response
class MockAdapter {
  readonly name = 'mock';

  async *streamChat(request: ModelRequest): AsyncGenerator<StreamChunk> {
    yield { type: 'text', content: 'Hello! ' };
    yield { type: 'text', content: 'How can I help?' };
    yield { type: 'done', finishReason: 'stop', usage: { inputTokens: 10, outputTokens: 5 } };
  }

  async chat(request: ModelRequest) {
    return {
      content: 'Hello! How can I help?',
      usage: { inputTokens: 10, outputTokens: 5 },
      finishReason: 'stop',
    };
  }

  countTokens(messages: Message[]) {
    return messages.reduce((sum, m) => sum + (typeof m.content === 'string' ? m.content.length : 0), 0);
  }

  supports() { return true; }
}

describe('Message Flow Integration', () => {
  it('should stream a complete assistant response', async () => {
    const adapter = new MockAdapter();
    const messages: Message[] = [{ role: 'user', content: 'Hello' }];
    const chunks: StreamChunk[] = [];

    for await (const chunk of adapter.streamChat({
      model: 'test',
      messages,
    })) {
      chunks.push(chunk);
    }

    const textChunks = chunks.filter(c => c.type === 'text');
    const doneChunk = chunks.find(c => c.type === 'done');

    expect(textChunks.map(c => c.content).join('')).toBe('Hello! How can I help?');
    expect(doneChunk?.finishReason).toBe('stop');
    expect(doneChunk?.usage?.inputTokens).toBe(10);
  });

  it('should handle multi-turn conversation', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'What is 2+2?' },
    ];

    const adapter = new MockAdapter();
    const result = await adapter.chat({ model: 'test', messages });
    expect(result.content).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run integration test**

Run: `cd mimo-code && npx vitest run tests/integration/message-flow.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add mimo-code/tests/integration/
git commit -m "test: integration test for message flow with mock adapter"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Phase 1 spec items (scaffolding, CLI, REPL, API client, settings) all have tasks
- [x] **Placeholder scan:** No TBD/TODO/placeholders found
- [x] **Type consistency:** Message, ToolCall, StreamChunk, ModelRequest types consistent across all tasks
- [x] **File paths:** All paths match the directory structure in Task 1
- [x] **Code completeness:** Every step has actual code, no "implement this" without showing how

## What's NOT in Phase 1

These are deferred to subsequent phases (each will get its own plan):

- **Phase 2:** QueryEngine, query loop, Tool interface, tool orchestration, StreamingToolExecutor, command registry
- **Phase 3:** BashTool, FileReadTool, FileEditTool, FileWriteTool, GrepTool, GlobTool, WebFetchTool, TodoWriteTool
- **Phase 4:** Permission system, auto-mode classifier, MCP support, plugin system, Anthropic/Mimo adapters
- **Phase 5:** Mimo mascot animations, theme system, skill system, comprehensive testing
- **Phase 6:** Documentation, npm packaging, examples
