# Context Compression, Mimo Adapter & Xiaomi Cat Buddy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement four context compression strategies, a Mimo-native API adapter, and port the Xiaomi Cat companion sprite into mimo-code.

**Architecture:** ContextManager is the foundation (no dependencies), MimoAdapter extends OpenAIAdapter and integrates ContextManager, and the buddy system is independent UI layer using AppState and Ink. All three share the existing Message type and SettingsJson config.

**Tech Stack:** TypeScript 5.x, Vitest, Ink (React for CLI), existing mimo-code adapter pattern

**Design Spec:** `docs/superpowers/specs/2026-05-29-context-mimo-buddy-design.md`

---

## File Structure

### New Files
- `src/services/compact/tokenCounter.ts` — TokenCounter interface + EstimatedTokenCounter
- `src/services/api/adapters/mimo.ts` — MimoAdapter extending OpenAIAdapter
- `src/buddy/types.ts` — Companion types (Species, CompanionBones, CompanionSoul, Companion)
- `src/buddy/sprites.ts` — Xiaomi Cat 8-frame ASCII art
- `src/buddy/companion.ts` — Companion resolution from settings
- `src/buddy/prompt.ts` — System prompt injection for companion
- `src/buddy/CompanionSprite.tsx` — Ink component rendering the sprite
- `src/commands/buddy.ts` — /buddy slash command
- `tests/unit/compact/tokenCounter.test.ts`
- `tests/unit/compact/contextManager.test.ts`
- `tests/unit/api/mimo-adapter.test.ts`
- `tests/unit/buddy/companion.test.ts`
- `tests/unit/buddy/sprites.test.ts`
- `tests/unit/buddy/prompt.test.ts`

### Modified Files
- `src/services/compact/contextManager.ts` — Rewrite with four strategies
- `src/query.ts` — Update `QueryDeps.autocompact` to async
- `src/services/api/client.ts` — Register MimoAdapter
- `src/types/config.ts` — Add context, mimo, buddy config sections
- `src/state/AppStateStore.ts` — Add companionReaction, companionPetAt, buddyEnabled
- `src/screens/REPL.tsx` — Wire in MimoAdapter, buddy, updated ContextManager
- `src/commands.ts` — (no change, just re-export)

---

## Phase 1: Context Compression

### Task 1: Create TokenCounter

**Files:**
- Create: `src/services/compact/tokenCounter.ts`
- Test: `tests/unit/compact/tokenCounter.test.ts`

- [ ] **Step 1: Write failing tests for TokenCounter**

```ts
// tests/unit/compact/tokenCounter.test.ts
import { describe, it, expect } from 'vitest';
import { EstimatedTokenCounter } from '../../../src/services/compact/tokenCounter.js';

describe('EstimatedTokenCounter', () => {
  const counter = new EstimatedTokenCounter();

  it('counts plain text messages', () => {
    const msgs = [{ role: 'user' as const, content: 'hello world' }];
    // 11 chars / 4 = 2.75 → ceil = 3, +4 overhead = 7
    expect(counter.countMessages(msgs)).toBe(7);
  });

  it('counts multi-part content', () => {
    const msgs = [{
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: 'hello' },
        { type: 'text' as const, text: 'world' },
      ],
    }];
    // 5 + 5 = 10 chars → ceil(10/4)=3, +4 overhead = 7
    expect(counter.countMessages(msgs)).toBe(7);
  });

  it('counts tool calls', () => {
    const msgs = [{
      role: 'assistant' as const,
      content: 'ok',
      toolCalls: [{
        id: 'tc1',
        type: 'function' as const,
        function: { name: 'BashTool', arguments: '{"cmd":"ls"}' },
      }],
    }];
    // content: ceil(2/4)=1, tool name: ceil(8/4)=2, args: ceil(11/4)=3, overhead=4 → 10
    expect(counter.countMessages(msgs)).toBe(10);
  });

  it('counts tool result messages', () => {
    const msgs = [{ role: 'tool' as const, content: 'result text', toolCallId: 'tc1' }];
    // content: ceil(11/4)=3, toolCallId: ceil(3/4)=1, overhead=4 → 8
    expect(counter.countMessages(msgs)).toBe(8);
  });

  it('counts multiple messages', () => {
    const msgs = [
      { role: 'user' as const, content: 'hi' },
      { role: 'assistant' as const, content: 'hello' },
    ];
    expect(counter.countMessages(msgs)).toBe(counter.countMessages([msgs[0]]) + counter.countMessages([msgs[1]]));
  });

  it('countText returns ceil(length/4)', () => {
    expect(counter.countText('abcdefgh')).toBe(2); // 8/4=2
    expect(counter.countText('abcdefghi')).toBe(3); // 9/4=2.25→3
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/compact/tokenCounter.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement TokenCounter**

```ts
// src/services/compact/tokenCounter.ts
import type { Message } from '../../types/message.js';

export interface TokenCounter {
  countMessages(messages: Message[]): number;
  countText(text: string): number;
}

export class EstimatedTokenCounter implements TokenCounter {
  private charsPerToken: number;

  constructor(charsPerToken: number = 4) {
    this.charsPerToken = charsPerToken;
  }

  countMessages(messages: Message[]): number {
    let total = 0;
    for (const msg of messages) {
      total += this.countMessage(msg);
    }
    return total;
  }

  countMessage(msg: Message): number {
    let total = 0;
    if (typeof msg.content === 'string') {
      total += this.countText(msg.content);
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.text) total += this.countText(part.text);
      }
    }
    if (msg.toolCalls) {
      for (const tc of msg.toolCalls) {
        total += this.countText(tc.function.name);
        total += this.countText(tc.function.arguments);
      }
    }
    if (msg.toolCallId) {
      total += this.countText(msg.toolCallId);
    }
    total += 4; // message overhead (role, formatting)
    return total;
  }

  countText(text: string): number {
    return Math.ceil(text.length / this.charsPerToken);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/compact/tokenCounter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/compact/tokenCounter.ts tests/unit/compact/tokenCounter.test.ts
git commit -m "feat(compact): add TokenCounter interface and EstimatedTokenCounter"
```

---

### Task 2: Rewrite ContextManager with Four Strategies

**Files:**
- Modify: `src/services/compact/contextManager.ts`
- Test: `tests/unit/compact/contextManager.test.ts`

- [ ] **Step 1: Write failing tests for all four strategies**

```ts
// tests/unit/compact/contextManager.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ContextManager } from '../../../src/services/compact/contextManager.js';
import type { Message } from '../../../src/types/message.js';

function msg(role: Message['role'], content: string, extra?: Partial<Message>): Message {
  return { role, content, ...extra };
}

describe('ContextManager', () => {
  describe('microcompact', () => {
    it('truncates long tool outputs', () => {
      const cm = new ContextManager({ maxToolOutputLength: 100 });
      const longContent = 'x'.repeat(200);
      const messages = [msg('tool', longContent, { toolCallId: 'tc1' })];
      const result = cm.microcompact(messages);
      expect(result.compressed).toBe(true);
      expect((result.messages[0].content as string).length).toBeLessThan(200);
      expect(result.messages[0].content).toContain('[...truncated...]');
    });

    it('removes empty messages', () => {
      const cm = new ContextManager();
      const messages = [msg('user', 'hello'), msg('assistant', ''), msg('user', 'world')];
      const result = cm.microcompact(messages);
      expect(result.compressed).toBe(true);
      expect(result.messages).toHaveLength(2);
      expect(result.removedCount).toBe(1);
    });

    it('keeps non-empty messages unchanged', () => {
      const cm = new ContextManager();
      const messages = [msg('user', 'hello'), msg('assistant', 'hi')];
      const result = cm.microcompact(messages);
      expect(result.compressed).toBe(false);
      expect(result.messages).toHaveLength(2);
    });
  });

  describe('autocompact', () => {
    it('returns unchanged when under threshold', async () => {
      const cm = new ContextManager({ maxTokens: 1000, compactThreshold: 0.8 });
      const messages = [msg('user', 'short')];
      const result = await cm.autocompact(messages);
      expect(result.compressed).toBe(false);
    });

    it('compresses earliest messages when over threshold', async () => {
      const summarize = vi.fn().mockResolvedValue('summary text');
      const cm = new ContextManager({
        maxTokens: 20,
        compactThreshold: 0.5,
        summarize,
      });
      // Create enough messages to exceed threshold
      const messages = Array.from({ length: 10 }, (_, i) =>
        msg(i % 2 === 0 ? 'user' : 'assistant', `message ${i} with some content here`),
      );
      const result = await cm.autocompact(messages);
      expect(result.compressed).toBe(true);
      expect(result.removedCount).toBeGreaterThan(0);
      expect(summarize).toHaveBeenCalled();
      // Should contain summary message
      const summaryMsg = result.messages.find(m =>
        typeof m.content === 'string' && m.content.includes('Context compressed'),
      );
      expect(summaryMsg).toBeDefined();
    });

    it('skips compression when fewer than 3 non-system messages', async () => {
      const cm = new ContextManager({ maxTokens: 5, compactThreshold: 0.1 });
      const messages = [msg('user', 'a'), msg('assistant', 'b')];
      const result = await cm.autocompact(messages);
      expect(result.compressed).toBe(false);
    });
  });

  describe('collapseToolSequences', () => {
    it('collapses long tool sequences', () => {
      const cm = new ContextManager();
      const messages = [
        msg('user', 'do stuff'),
        msg('assistant', 'ok', { toolCalls: [{ id: '1', type: 'function', function: { name: 'BashTool', arguments: '{}' } }] }),
        msg('tool', 'r1', { toolCallId: '1' }),
        msg('assistant', 'more', { toolCalls: [{ id: '2', type: 'function', function: { name: 'FileReadTool', arguments: '{}' } }] }),
        msg('tool', 'r2', { toolCallId: '2' }),
        msg('assistant', 'done', { toolCalls: [{ id: '3', type: 'function', function: { name: 'GrepTool', arguments: '{}' } }] }),
        msg('tool', 'r3', { toolCallId: '3' }),
        msg('assistant', 'end', { toolCalls: [{ id: '4', type: 'function', function: { name: 'GlobTool', arguments: '{}' } }] }),
        msg('tool', 'r4', { toolCallId: '4' }),
        msg('user', 'next'),
      ];
      const result = cm.collapseToolSequences(messages);
      expect(result.compressed).toBe(true);
      expect(result.removedCount).toBeGreaterThan(0);
      expect(result.messages.some(m =>
        typeof m.content === 'string' && m.content.includes('Executed'),
      )).toBe(true);
    });

    it('does not collapse short tool sequences', () => {
      const cm = new ContextManager();
      const messages = [
        msg('user', 'do stuff'),
        msg('assistant', 'ok', { toolCalls: [{ id: '1', type: 'function', function: { name: 'BashTool', arguments: '{}' } }] }),
        msg('tool', 'r1', { toolCallId: '1' }),
        msg('user', 'next'),
      ];
      const result = cm.collapseToolSequences(messages);
      expect(result.compressed).toBe(false);
    });
  });

  describe('reactiveCompress', () => {
    it('preserves recent N messages', () => {
      const cm = new ContextManager({ preserveRecent: 3 });
      const messages = [
        msg('system', 'sys'),
        msg('user', 'a'), msg('assistant', 'b'),
        msg('user', 'c'), msg('assistant', 'd'),
        msg('user', 'e'), msg('assistant', 'f'),
      ];
      const result = cm.reactiveCompress(messages);
      expect(result.compressed).toBe(true);
      // system + compression notice + 3 recent
      expect(result.messages).toHaveLength(5);
      expect(result.messages[0].role).toBe('system');
      expect(result.messages[1].content).toContain('Context compressed');
    });

    it('returns unchanged when few messages', () => {
      const cm = new ContextManager({ preserveRecent: 5 });
      const messages = [msg('user', 'a'), msg('assistant', 'b')];
      const result = cm.reactiveCompress(messages);
      expect(result.compressed).toBe(false);
    });
  });

  describe('compress pipeline', () => {
    it('runs microcompact then autocompact', async () => {
      const cm = new ContextManager({ maxTokens: 1000 });
      const messages = [msg('user', 'hello'), msg('assistant', 'world')];
      const result = await cm.compress(messages);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('countTokens', () => {
    it('delegates to token counter', () => {
      const cm = new ContextManager();
      const messages = [msg('user', 'hello')];
      expect(cm.countTokens(messages)).toBeGreaterThan(0);
    });
  });

  describe('updateMaxTokens', () => {
    it('updates the max tokens', () => {
      const cm = new ContextManager({ maxTokens: 100 });
      expect(cm.maxTokens).toBe(100);
      cm.updateMaxTokens(200);
      expect(cm.maxTokens).toBe(200);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/compact/contextManager.test.ts`
Expected: FAIL — current ContextManager doesn't match new API

- [ ] **Step 3: Rewrite ContextManager**

```ts
// src/services/compact/contextManager.ts
import type { Message } from '../../types/message.js';
import { type TokenCounter, EstimatedTokenCounter } from './tokenCounter.js';

export interface CompressionResult {
  messages: Message[];
  compressed: boolean;
  removedCount: number;
  strategy: string;
}

export interface ContextManagerConfig {
  maxTokens: number;
  compactThreshold: number;
  maxToolOutputLength: number;
  preserveRecent: number;
  summarize: (text: string) => Promise<string>;
}

const DEFAULT_CONFIG: ContextManagerConfig = {
  maxTokens: 8000,
  compactThreshold: 0.8,
  maxToolOutputLength: 2000,
  preserveRecent: 5,
  summarize: async (text) => `[Summary of ${text.length} chars]`,
};

export class ContextManager {
  private config: ContextManagerConfig;
  private tokenCounter: TokenCounter;

  constructor(config: Partial<ContextManagerConfig> = {}, tokenCounter?: TokenCounter) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tokenCounter = tokenCounter ?? new EstimatedTokenCounter();
  }

  get maxTokens(): number {
    return this.config.maxTokens;
  }

  countTokens(messages: Message[]): number {
    return this.tokenCounter.countMessages(messages);
  }

  updateMaxTokens(maxTokens: number): void {
    this.config.maxTokens = maxTokens;
  }

  setSummarize(summarize: (text: string) => Promise<string>): void {
    this.config.summarize = summarize;
  }

  // Strategy 1: Remove empty messages, truncate long tool outputs
  microcompact(messages: Message[]): CompressionResult {
    let changed = false;
    const result: Message[] = [];

    for (const msg of messages) {
      // Remove empty/meaningless messages
      if (typeof msg.content === 'string' && msg.content.trim().length === 0 && !msg.toolCalls) {
        changed = true;
        continue;
      }
      // Truncate long tool outputs
      if (msg.role === 'tool' && typeof msg.content === 'string' && msg.content.length > this.config.maxToolOutputLength) {
        changed = true;
        const half = Math.floor(this.config.maxToolOutputLength / 2);
        result.push({
          ...msg,
          content: msg.content.slice(0, half) + '\n\n[...truncated...]\n\n' + msg.content.slice(-half),
        });
        continue;
      }
      result.push(msg);
    }

    return {
      messages: result,
      compressed: changed,
      removedCount: messages.length - result.length,
      strategy: 'microcompact',
    };
  }

  // Strategy 2: LLM-summarize oldest messages when over threshold
  async autocompact(messages: Message[]): Promise<CompressionResult> {
    const tokens = this.tokenCounter.countMessages(messages);
    if (tokens <= this.config.maxTokens * this.config.compactThreshold) {
      return { messages, compressed: false, removedCount: 0, strategy: 'autocompact' };
    }

    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystem = messages.filter(m => m.role !== 'system');
    const compressCount = Math.floor(nonSystem.length / 2);

    if (compressCount < 3) {
      return { messages, compressed: false, removedCount: 0, strategy: 'autocompact' };
    }

    const toCompress = nonSystem.slice(0, compressCount);
    const toKeep = nonSystem.slice(compressCount);

    const conversationText = toCompress
      .map(m => `[${m.role}]: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
      .join('\n');

    const summary = await this.config.summarize(conversationText);

    const summaryMessage: Message = {
      role: 'system',
      content: `[Context compressed — ${compressCount} messages summarized]\n\n${summary}`,
    };

    const result = [...systemMessages, summaryMessage, ...toKeep];

    return {
      messages: result,
      compressed: true,
      removedCount: compressCount,
      strategy: 'autocompact',
    };
  }

  // Strategy 3: Collapse long tool call sequences into summaries
  collapseToolSequences(messages: Message[]): CompressionResult {
    const result: Message[] = [];
    let toolSequence: Message[] = [];
    let collapsed = 0;

    const flushSequence = () => {
      if (toolSequence.length >= 4) {
        const toolNames = toolSequence
          .filter(m => m.toolCalls)
          .flatMap(m => m.toolCalls!.map(tc => tc.function.name));
        const uniqueTools = [...new Set(toolNames)];
        result.push({
          role: 'system',
          content: `[Executed ${toolSequence.length} tool calls: ${uniqueTools.join(', ')}]`,
        });
        collapsed += toolSequence.length - 1;
      } else {
        result.push(...toolSequence);
      }
      toolSequence = [];
    };

    for (const msg of messages) {
      if (msg.role === 'tool' || (msg.role === 'assistant' && msg.toolCalls)) {
        toolSequence.push(msg);
      } else {
        flushSequence();
        result.push(msg);
      }
    }
    flushSequence();

    return {
      messages: result,
      compressed: collapsed > 0,
      removedCount: collapsed,
      strategy: 'context_collapse',
    };
  }

  // Strategy 4: Emergency — keep only system + recent N messages
  reactiveCompress(messages: Message[]): CompressionResult {
    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystem = messages.filter(m => m.role !== 'system');

    if (nonSystem.length <= this.config.preserveRecent) {
      return { messages, compressed: false, removedCount: 0, strategy: 'reactive' };
    }

    const recent = nonSystem.slice(-this.config.preserveRecent);
    const removed = nonSystem.length - this.config.preserveRecent;

    const result: Message[] = [
      ...systemMessages,
      {
        role: 'system',
        content: `[Context compressed: ${removed} earlier messages removed due to length limits]`,
      },
      ...recent,
    ];

    return {
      messages: result,
      compressed: true,
      removedCount: removed,
      strategy: 'reactive',
    };
  }

  // Full pipeline: microcompact → autocompact → collapse if still over
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

    return result.messages;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/compact/contextManager.test.ts`
Expected: PASS

- [ ] **Step 5: Update query.ts — make autocompact async**

The existing `QueryDeps.autocompact` is sync `(messages: Message[]) => Message[]`. The new ContextManager's `autocompact` is async. Update query.ts:

```ts
// src/query.ts — change autocompact signature
export interface QueryDeps {
  callModel: (request: ModelRequest) => AsyncGenerator<StreamChunk>;
  microcompact: (messages: Message[]) => Message[];
  autocompact: (messages: Message[]) => Promise<Message[]>;  // ← now async
  uuid: () => string;
  getTool: (name: string) => Tool | undefined;
  toolContext: ToolUseContext;
}
```

Also update the `queryLoop` function to `await` the autocompact call. Find where `deps.autocompact` is called and add `await`.

- [ ] **Step 6: Update REPL.tsx constructor**

Change `new ContextManager(8000)` to `new ContextManager({ maxTokens: 8000 })` and wrap the deps:

```ts
// In REPL.tsx engine setup:
const contextManagerRef = useRef(new ContextManager({ maxTokens: 8000 }));

// In QueryEngine config:
microcompact: (m) => contextManagerRef.current.microcompact(m).messages,
autocompact: async (m) => (await contextManagerRef.current.autocompact(m)).messages,
```

- [ ] **Step 7: Verify existing integration still works**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run`
Expected: All existing tests pass

- [ ] **Step 8: Commit**

```bash
git add src/services/compact/contextManager.ts src/services/compact/tokenCounter.ts src/query.ts src/screens/REPL.tsx tests/unit/compact/
git commit -m "feat(compact): rewrite ContextManager with four compression strategies"
```

---

### Task 3: Update Types and Config

**Files:**
- Modify: `src/types/config.ts`

- [ ] **Step 1: Add new config interfaces**

```ts
// src/types/config.ts — add at end of file

export interface ContextConfig {
  maxTokens?: number;
  compactThreshold?: number;
  maxToolOutputLength?: number;
  autoCompact?: boolean;
}

export interface MimoConfig {
  model?: string;
  contextWindow?: number;
  maxOutput?: number;
}

export interface BuddyConfig {
  enabled?: boolean;
  muted?: boolean;
  name?: string;
}
```

Also add these to SettingsJson:

```ts
export interface SettingsJson {
  // ... existing fields ...
  context?: ContextConfig;
  mimo?: MimoConfig;
  buddy?: BuddyConfig;
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/types/config.ts
git commit -m "feat(types): add ContextConfig, MimoConfig, BuddyConfig to SettingsJson"
```

---

## Phase 2: Mimo Adapter

### Task 4: Create MimoAdapter

**Files:**
- Create: `src/services/api/adapters/mimo.ts`
- Test: `tests/unit/api/mimo-adapter.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/api/mimo-adapter.test.ts
import { describe, it, expect, vi } from 'vitest';
import { MimoAdapter } from '../../../src/services/api/adapters/mimo.js';

describe('MimoAdapter', () => {
  it('supports mimo-* models', () => {
    const adapter = new MimoAdapter('https://api.test.com', 'key');
    expect(adapter.supports('mimo-large')).toBe(true);
    expect(adapter.supports('mimo-medium')).toBe(true);
    expect(adapter.supports('mimo-small')).toBe(true);
    expect(adapter.supports('gpt-4')).toBe(false);
    expect(adapter.supports('claude-3')).toBe(false);
  });

  it('returns correct context window for known models', () => {
    const adapter = new MimoAdapter('https://api.test.com', 'key');
    expect(adapter.getContextWindow('mimo-large')).toBe(128000);
    expect(adapter.getContextWindow('mimo-medium')).toBe(32000);
    expect(adapter.getContextWindow('mimo-small')).toBe(8000);
    expect(adapter.getContextWindow('mimo-unknown')).toBe(128000);
  });

  it('has name "mimo"', () => {
    const adapter = new MimoAdapter('https://api.test.com', 'key');
    expect(adapter.name).toBe('mimo');
  });

  it('countTokens returns positive number', () => {
    const adapter = new MimoAdapter('https://api.test.com', 'key');
    const count = adapter.countTokens([{ role: 'user', content: 'hello' }]);
    expect(count).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/api/mimo-adapter.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement MimoAdapter**

```ts
// src/services/api/adapters/mimo.ts
import { OpenAIAdapter } from './openai.js';
import type { ModelRequest, StreamChunk } from '../../../types/api.js';
import type { Message } from '../../../types/message.js';
import { ContextManager } from '../../compact/contextManager.js';

interface MimoModelConfig {
  contextWindow: number;
  maxOutput: number;
}

const MIMO_MODELS: Record<string, MimoModelConfig> = {
  'mimo-large':  { contextWindow: 128000, maxOutput: 8192 },
  'mimo-medium': { contextWindow: 32000,  maxOutput: 4096 },
  'mimo-small':  { contextWindow: 8000,   maxOutput: 2048 },
};

export class MimoAdapter extends OpenAIAdapter {
  readonly name = 'mimo';
  private contextManager: ContextManager;

  constructor(endpoint: string, apiKey: string) {
    super(endpoint, apiKey);
    this.contextManager = new ContextManager();
  }

  supports(model: string): boolean {
    return model.startsWith('mimo-');
  }

  getContextWindow(model: string): number {
    return MIMO_MODELS[model]?.contextWindow ?? 128000;
  }

  countTokens(messages: Message[]): number {
    return this.contextManager.countTokens(messages);
  }

  async *streamChat(request: ModelRequest): AsyncGenerator<StreamChunk> {
    const contextWindow = this.getContextWindow(request.model);
    this.contextManager.updateMaxTokens(contextWindow);

    this.contextManager.setSummarize(async (text) => {
      const response = await this.chat({
        model: request.model,
        messages: [{ role: 'user', content: text }],
        system: '请将以下对话压缩为简要摘要，保留关键信息、文件路径和决策结论。输出不超过 200 字。',
        maxTokens: 300,
      });
      return response.content;
    });

    const compressed = await this.contextManager.compress(request.messages);

    yield* super.streamChat({
      ...request,
      messages: compressed,
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/api/mimo-adapter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/api/adapters/mimo.ts tests/unit/api/mimo-adapter.test.ts
git commit -m "feat(api): add MimoAdapter with context-aware compression"
```

---

### Task 5: Register MimoAdapter in APIClient

**Files:**
- Modify: `src/services/api/client.ts`

- [ ] **Step 1: Add MimoAdapter import and registration**

In `src/services/api/client.ts`, add the import and register in constructor:

```ts
import { MimoAdapter } from './adapters/mimo.js';

// In constructor:
constructor(endpoint: string, apiKey: string) {
  this.defaultAdapter = new OpenAIAdapter(endpoint, apiKey);
  this.adapters.push(new MimoAdapter(endpoint, apiKey));
  this.adapters.push(this.defaultAdapter);
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Run all tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/services/api/client.ts
git commit -m "feat(api): register MimoAdapter in APIClient"
```

---

## Phase 3: Xiaomi Cat Buddy

### Task 6: Create Buddy Types

**Files:**
- Create: `src/buddy/types.ts`
- Test: `tests/unit/buddy/types.test.ts`

- [ ] **Step 1: Write test**

```ts
// tests/unit/buddy/types.test.ts
import { describe, it, expect } from 'vitest';
import { xiaomi_cat } from '../../../src/buddy/types.js';

describe('buddy types', () => {
  it('exports xiaomi_cat constant', () => {
    expect(xiaomi_cat).toBe('xiaomi_cat');
  });
});
```

- [ ] **Step 2: Create types file**

```ts
// src/buddy/types.ts
export const xiaomi_cat = 'xiaomi_cat' as const;
export type Species = typeof xiaomi_cat;

export type CompanionBones = {
  species: Species;
};

export type CompanionSoul = {
  name: string;
  personality: string;
};

export type Companion = CompanionBones &
  CompanionSoul & {
    hatchedAt: number;
  };

export type StoredCompanion = CompanionSoul & { hatchedAt: number };
```

- [ ] **Step 3: Run test**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/buddy/types.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
mkdir -p src/buddy tests/unit/buddy
git add src/buddy/types.ts tests/unit/buddy/types.test.ts
git commit -m "feat(buddy): add companion type definitions"
```

---

### Task 7: Create Buddy Sprites

**Files:**
- Create: `src/buddy/sprites.ts`
- Test: `tests/unit/buddy/sprites.test.ts`

- [ ] **Step 1: Write tests**

```ts
// tests/unit/buddy/sprites.test.ts
import { describe, it, expect } from 'vitest';
import { renderSprite, spriteFrameCount, renderFace } from '../../../src/buddy/sprites.js';

describe('sprites', () => {
  it('renderSprite returns 7 lines', () => {
    const frame = renderSprite(0);
    expect(frame).toHaveLength(7);
  });

  it('renderSprite wraps frame index', () => {
    const count = spriteFrameCount();
    const frame1 = renderSprite(count);
    const frame2 = renderSprite(0);
    expect(frame1).toEqual(frame2);
  });

  it('spriteFrameCount returns 8', () => {
    expect(spriteFrameCount()).toBe(8);
  });

  it('renderFace returns cat face', () => {
    expect(renderFace()).toBe('(●ω●)');
  });

  it('all frames have consistent width', () => {
    for (let i = 0; i < spriteFrameCount(); i++) {
      const frame = renderSprite(i);
      for (const line of frame) {
        expect(line.length).toBeLessThanOrEqual(14);
      }
    }
  });
});
```

- [ ] **Step 2: Create sprites file**

```ts
// src/buddy/sprites.ts
// Xiaomi Cat sprite — MI logo deconstructed into cat anatomy.
// M = ears (two arches), I = tail (vertical line), super-ellipse = face.
// Each frame is 7 lines tall, ~12 chars wide.

const XIAOMI_CAT_FRAMES: string[][] = [
  // Frame 0: Rest
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ●    ● │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
  // Frame 1: Look left
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │ ●     ● │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯ │ ',
    '           ╱  ',
  ],
  // Frame 2: Look right
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ●    ●  │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯   ',
    '   ╲         ',
  ],
  // Frame 3: Blink
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ─    ─ │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
  // Frame 4: Happy
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ◠    ◠ │ ',
    '  │   ╰╯   │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
  // Frame 5: Surprised
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ◉    ◉ │ ',
    '  │    ○   │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
  // Frame 6: Thinking
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ●    ● │ ',
    '  │   ∪    │ ',
    '   ╲      ╱  ',
    '    ╰────╯ ╱ ',
    '          ╱  ',
  ],
  // Frame 7: Sleepy
  [
    '     z       ',
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ─    ─ │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
  ],
];

export function renderSprite(frame: number): string[] {
  return XIAOMI_CAT_FRAMES[frame % XIAOMI_CAT_FRAMES.length]!;
}

export function spriteFrameCount(): number {
  return XIAOMI_CAT_FRAMES.length;
}

export function renderFace(): string {
  return '(●ω●)';
}
```

- [ ] **Step 3: Run tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/buddy/sprites.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/buddy/sprites.ts tests/unit/buddy/sprites.test.ts
git commit -m "feat(buddy): add Xiaomi Cat 8-frame ASCII sprite art"
```

---

### Task 8: Create Companion Resolver

**Files:**
- Create: `src/buddy/companion.ts`
- Test: `tests/unit/buddy/companion.test.ts`

- [ ] **Step 1: Write tests**

```ts
// tests/unit/buddy/companion.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getCompanion, setCompanionCache, resolveCompanion, roll, getCachedKey } from '../../../src/buddy/companion.js';

describe('companion', () => {
  beforeEach(() => {
    // Clear cache between tests
    setCompanionCache('test', undefined);
  });

  it('roll returns xiaomi_cat bones', () => {
    const result = roll();
    expect(result.bones.species).toBe('xiaomi_cat');
  });

  it('resolveCompanion returns companion when stored and not muted', () => {
    const result = resolveCompanion(
      { name: 'TestCat', personality: 'curious', hatchedAt: Date.now() },
      false,
    );
    expect(result).toBeDefined();
    expect(result!.species).toBe('xiaomi_cat');
    expect(result!.name).toBe('TestCat');
  });

  it('resolveCompanion returns undefined when muted', () => {
    const result = resolveCompanion(
      { name: 'TestCat', personality: 'curious', hatchedAt: Date.now() },
      true,
    );
    expect(result).toBeUndefined();
  });

  it('resolveCompanion returns undefined when no stored data', () => {
    const result = resolveCompanion(undefined, false);
    expect(result).toBeUndefined();
  });

  it('setCompanionCache and getCompanion work together', () => {
    expect(getCompanion()).toBeUndefined();
    const companion = resolveCompanion(
      { name: '猫', personality: 'lazy', hatchedAt: 1 },
      false,
    )!;
    setCompanionCache('user1', companion);
    expect(getCompanion()).toEqual(companion);
    expect(getCachedKey()).toBe('user1');
  });
});
```

- [ ] **Step 2: Create companion file**

```ts
// src/buddy/companion.ts
import type { Companion, CompanionBones, StoredCompanion } from './types.js';
import { xiaomi_cat } from './types.js';

const XIAOMI_CAT_BONES: CompanionBones = {
  species: xiaomi_cat,
};

let cachedCompanion: Companion | undefined;
let cachedKey: string | undefined;

/**
 * Build a companion from stored config values.
 * Returns undefined if buddy is not configured.
 */
export function resolveCompanion(
  stored: StoredCompanion | undefined,
  muted: boolean,
): Companion | undefined {
  if (!stored || muted) return undefined;
  return { ...XIAOMI_CAT_BONES, ...stored };
}

export function getCompanion(): Companion | undefined {
  return cachedCompanion;
}

export function setCompanionCache(key: string, companion: Companion | undefined): void {
  cachedKey = key;
  cachedCompanion = companion;
}

export function getCachedKey(): string | undefined {
  return cachedKey;
}

export function roll(): { bones: CompanionBones } {
  return { bones: XIAOMI_CAT_BONES };
}
```

- [ ] **Step 3: Run tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/buddy/companion.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/buddy/companion.ts tests/unit/buddy/companion.test.ts
git commit -m "feat(buddy): add companion resolver from settings"
```

---

### Task 9: Create Buddy Prompt

**Files:**
- Create: `src/buddy/prompt.ts`
- Test: `tests/unit/buddy/prompt.test.ts`

- [ ] **Step 1: Write tests**

```ts
// tests/unit/buddy/prompt.test.ts
import { describe, it, expect } from 'vitest';
import { companionIntroText } from '../../../src/buddy/prompt.js';

describe('buddy prompt', () => {
  it('generates intro text with companion name', () => {
    const text = companionIntroText('小米猫');
    expect(text).toContain('小米猫');
    expect(text).toContain('Xiaomi Cat');
  });

  it('mentions companion stays out of the way', () => {
    const text = companionIntroText('TestCat');
    expect(text).toContain('stay out of the way');
  });
});
```

- [ ] **Step 2: Create prompt file**

```ts
// src/buddy/prompt.ts
import type { Message } from '../types/message.js';
import type { Companion } from './types.js';

export function companionIntroText(name: string): string {
  return `# Companion

A small Xiaomi Cat named ${name} sits beside the user's input box and occasionally comments in a speech bubble. The cat's silhouette deconstructs the Xiaomi MI logo — M-shaped ears, I-shaped tail, super-ellipse face. You're not ${name} — it's a separate watcher.

When the user addresses ${name} directly (by name), its bubble will answer. Your job in that moment is to stay out of the way: respond in ONE line or less, or just answer any part of the message meant for you. Don't explain that you're not ${name} — they know. Don't narrate what ${name} might say — the bubble handles that.`;
}

export function getCompanionSystemPrompt(companion: Companion | undefined): string | undefined {
  if (!companion) return undefined;
  return companionIntroText(companion.name);
}
```

- [ ] **Step 3: Run tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/buddy/prompt.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/buddy/prompt.ts tests/unit/buddy/prompt.test.ts
git commit -m "feat(buddy): add companion system prompt injection"
```

---

### Task 10: Create CompanionSprite Component

**Files:**
- Create: `src/buddy/CompanionSprite.tsx`

- [ ] **Step 1: Create CompanionSprite component**

This is a React/Ink component. No automated test — verify visually.

```tsx
// src/buddy/CompanionSprite.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, Text } from 'ink';
import figures from 'figures';
import { renderFace, renderSprite, spriteFrameCount } from './sprites.js';
import type { Companion } from './types.js';

const TICK_MS = 500;
const BUBBLE_SHOW = 20;
const FADE_WINDOW = 6;
const PET_BURST_MS = 2500;
const MIN_COLS_FOR_FULL_SPRITE = 100;

const IDLE_SEQUENCE = [0, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 2, 0, 0, 0];

const H = figures.heart;
const PET_HEARTS = [
  `   ${H}    ${H}   `,
  `  ${H}  ${H}   ${H}  `,
  ` ${H}   ${H}  ${H}   `,
  `${H}  ${H}      ${H} `,
  '·    ·   ·  ',
];

function wrap(text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur.length + w.length + 1 > width && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

interface SpeechBubbleProps {
  text: string;
  color: string;
  fading: boolean;
  tail: 'right' | 'down';
}

function SpeechBubble({ text, color, fading, tail }: SpeechBubbleProps) {
  const lines = wrap(text, 30);
  const borderColor = fading ? 'gray' : color;

  const bubble = (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1} width={34}>
      {lines.map((l, i) => (
        <Text key={i} italic dimColor={!fading} color={fading ? 'gray' : undefined}>
          {l}
        </Text>
      ))}
    </Box>
  );

  if (tail === 'right') {
    return (
      <Box flexDirection="row" alignItems="center">
        {bubble}
        <Text color={borderColor}>─</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" alignItems="flex-end" marginRight={1}>
      {bubble}
      <Box flexDirection="column" alignItems="flex-end" paddingRight={6}>
        <Text color={borderColor}>╲ </Text>
        <Text color={borderColor}>╲</Text>
      </Box>
    </Box>
  );
}

interface CompanionSpriteProps {
  companion: Companion;
  reaction?: string;
  petAt?: number;
  columns: number;
  onReactionClear?: () => void;
}

export function CompanionSprite({
  companion,
  reaction,
  petAt,
  columns,
  onReactionClear,
}: CompanionSpriteProps) {
  const [tick, setTick] = useState(0);
  const lastSpokeTick = useRef(0);
  const [{ petStartTick, forPetAt }, setPetStart] = useState({
    petStartTick: 0,
    forPetAt: petAt,
  });

  if (petAt !== forPetAt) {
    setPetStart({ petStartTick: tick, forPetAt: petAt });
  }

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!reaction) return;
    lastSpokeTick.current = tick;
    const timer = setTimeout(() => {
      onReactionClear?.();
    }, BUBBLE_SHOW * TICK_MS);
    return () => clearTimeout(timer);
  }, [reaction, onReactionClear]);

  const color = '#FF6900';
  const bubbleAge = reaction ? tick - lastSpokeTick.current : 0;
  const fading = reaction !== undefined && bubbleAge >= BUBBLE_SHOW - FADE_WINDOW;
  const petAge = petAt ? tick - petStartTick : Infinity;
  const petting = petAge * TICK_MS < PET_BURST_MS;

  // Narrow terminal: one-line face
  if (columns < MIN_COLS_FOR_FULL_SPRITE) {
    const quip =
      reaction && reaction.length > 24 ? reaction.slice(0, 23) + '…' : reaction;
    const label = quip ? `"${quip}"` : companion.name;
    return (
      <Box paddingX={1} alignSelf="flex-end">
        <Text>
          {petting && <Text color="green">{figures.heart} </Text>}
          <Text bold color={color}>
            {renderFace()}
          </Text>{' '}
          <Text italic dimColor={!reaction} color={reaction ? (fading ? 'gray' : color) : undefined}>
            {label}
          </Text>
        </Text>
      </Box>
    );
  }

  // Full sprite
  const frameCount = spriteFrameCount();
  const heartFrame = petting ? PET_HEARTS[petAge % PET_HEARTS.length]! : null;

  let spriteFrame: number;
  if (reaction || petting) {
    spriteFrame = tick % 3;
  } else {
    const step = IDLE_SEQUENCE[tick % IDLE_SEQUENCE.length]!;
    spriteFrame = step === 3 ? 3 : step % frameCount;
  }

  const body = renderSprite(spriteFrame);
  const sprite = heartFrame ? [heartFrame, ...body] : body;

  const spriteColumn = (
    <Box flexDirection="column" flexShrink={0} alignItems="center">
      {sprite.map((line, i) => (
        <Text key={i} color={i === 0 && heartFrame ? 'green' : color}>
          {line}
        </Text>
      ))}
      <Text italic bold dimColor color={color}>
        {companion.name}
      </Text>
    </Box>
  );

  if (!reaction) {
    return <Box paddingX={1}>{spriteColumn}</Box>;
  }

  return (
    <Box flexDirection="row" alignItems="flex-end" paddingX={1} flexShrink={0}>
      <SpeechBubble text={reaction} color={color} fading={fading} tail="right" />
      {spriteColumn}
    </Box>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx tsc --noEmit`
Expected: PASS (may need to install `figures` and `@types/figures`)

- [ ] **Step 3: Install figures package if needed**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npm install figures`
Expected: Added to dependencies

- [ ] **Step 4: Commit**

```bash
git add src/buddy/CompanionSprite.tsx package.json package-lock.json
git commit -m "feat(buddy): add CompanionSprite Ink component with animations"
```

---

### Task 11: Create /buddy Command

**Files:**
- Create: `src/commands/buddy.ts`

- [ ] **Step 1: Create buddy command**

```ts
// src/commands/buddy.ts
import type { Command } from '../commands.js';

interface BuddyCommandDeps {
  onPet?: () => void;
  onMute?: () => void;
  onUnmute?: () => void;
  onSetName?: (name: string) => void;
  isMuted?: () => boolean;
  getName?: () => string;
}

export function createBuddyCommand(deps: BuddyCommandDeps = {}): Command {
  return {
    name: 'buddy',
    aliases: ['pet'],
    description: 'Interact with your Xiaomi Cat companion',
    isEnabled: () => true,
    call: async (args) => {
      const sub = args.trim().split(/\s+/)[0] || 'pet';
      const rest = args.trim().split(/\s+/).slice(1).join(' ');

      switch (sub) {
        case 'pet':
          deps.onPet?.();
          return `🐱 You pet the Xiaomi Cat! ${deps.getName?.() ?? '小米猫'} purrs happily.`;

        case 'mute':
          deps.onMute?.();
          return '🔇 Companion muted.';

        case 'unmute':
          deps.onUnmute?.();
          return '🔊 Companion unmuted.';

        case 'name':
          if (!rest) return `Current name: ${deps.getName?.() ?? '小米猫'}`;
          deps.onSetName?.(rest);
          return `🐱 Companion renamed to: ${rest}`;

        case 'status':
          return [
            `🐱 Companion: ${deps.getName?.() ?? '小米猫'}`,
            `   Muted: ${deps.isMuted?.() ? 'yes' : 'no'}`,
          ].join('\n');

        default:
          return [
            'Usage: /buddy <subcommand>',
            '  pet     — Pet the cat (default)',
            '  mute    — Hide the companion',
            '  unmute  — Show the companion',
            '  name <n> — Rename the companion',
            '  status  — Show companion info',
          ].join('\n');
      }
    },
  };
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/commands/buddy.ts
git commit -m "feat(commands): add /buddy slash command"
```

---

### Task 12: Wire Buddy into REPL

**Files:**
- Modify: `src/state/AppStateStore.ts`
- Modify: `src/screens/REPL.tsx`

- [ ] **Step 1: Extend AppState with buddy fields**

Add to `AppState` interface in `src/state/AppStateStore.ts`:

```ts
export interface AppState {
  // ... existing fields ...
  companionReaction?: string;
  companionPetAt?: number;
  buddyEnabled: boolean;
}
```

Add to `INITIAL_APP_STATE`:

```ts
export const INITIAL_APP_STATE: AppState = {
  // ... existing fields ...
  buddyEnabled: true,
};
```

- [ ] **Step 2: Wire buddy into REPL.tsx**

In `src/screens/REPL.tsx`, add imports and buddy integration:

```tsx
// Add imports
import { CompanionSprite } from '../buddy/CompanionSprite.js';
import { resolveCompanion, setCompanionCache } from '../buddy/companion.js';
import { getCompanionSystemPrompt } from '../buddy/prompt.js';
import { createBuddyCommand } from '../commands/buddy.js';
import type { StoredCompanion } from '../buddy/types.js';

// In the REPL component, after commandRegistry setup:
const buddyEnabled = useAppState(s => s.buddyEnabled);
const companionReaction = useAppState(s => s.companionReaction);
const companionPetAt = useAppState(s => s.companionPetAt);
const [companionMuted, setCompanionMuted] = useState(false);
const [companionName, setCompanionName] = useState('小米猫');

// Initialize companion
useEffect(() => {
  const stored: StoredCompanion = {
    name: companionName,
    personality: 'playful',
    hatchedAt: Date.now(),
  };
  const companion = resolveCompanion(stored, companionMuted);
  setCompanionCache('local', companion);
}, [companionName, companionMuted]);

// Register /buddy command
useEffect(() => {
  const buddyCmd = createBuddyCommand({
    onPet: () => store.setState({ companionPetAt: Date.now() }),
    onMute: () => setCompanionMuted(true),
    onUnmute: () => setCompanionMuted(false),
    onSetName: (name) => setCompanionName(name),
    isMuted: () => companionMuted,
    getName: () => companionName,
  });
  commandRegistry.current.register(buddyCmd);
}, [companionMuted, companionName, store]);

// In the return JSX, add CompanionSprite before the input area:
// {buddyEnabled && !companionMuted && (
//   <CompanionSprite
//     companion={...}
//     reaction={companionReaction}
//     petAt={companionPetAt}
//     columns={process.stdout.columns ?? 80}
//     onReactionClear={() => store.setState({ companionReaction: undefined })}
//   />
// )}
```

- [ ] **Step 3: Verify typecheck**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Run all tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/state/AppStateStore.ts src/screens/REPL.tsx
git commit -m "feat(buddy): wire CompanionSprite and /buddy command into REPL"
```

---

### Task 13: Final Integration Test

- [ ] **Step 1: Run full test suite**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run typecheck**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Manual smoke test**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx tsx src/entrypoints/cli.tsx`
- Verify Xiaomi Cat appears in terminal
- Type `/buddy pet` — verify heart animation
- Type `/buddy mute` — verify cat hides
- Type `/buddy unmute` — verify cat reappears
- Type a coding question — verify AI responds

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete context compression, Mimo adapter, and Xiaomi Cat buddy"
```
