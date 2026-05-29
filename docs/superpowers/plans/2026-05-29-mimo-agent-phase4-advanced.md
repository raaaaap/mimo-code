# Mimo Coding Agent - Phase 4: Advanced Features Implementation Plan

**Goal:** Add permission system, plugin system, MCP support, and additional API adapters.

**Prerequisites:** Phase 3 complete (8 tools, tool registry, query engine)

---

### Task 1: Permission System Core

**Files:**
- Create: `mimo-code/src/services/permissions/permissions.ts`
- Create: `mimo-code/src/hooks/useCanUseTool.tsx`
- Test: `mimo-code/tests/unit/permissions.test.ts`

- [ ] **Step 1: Write test**

```typescript
// tests/unit/permissions.test.ts
import { describe, it, expect } from 'vitest';
import { PermissionChecker } from '../../src/services/permissions/permissions.js';

describe('PermissionChecker', () => {
  it('should allow in bypass mode', () => {
    const checker = new PermissionChecker({ mode: 'bypassPermissions' });
    expect(checker.canUseTool('BashTool', { command: 'rm -rf /' })).toBe(true);
  });

  it('should deny writes in plan mode', () => {
    const checker = new PermissionChecker({ mode: 'plan' });
    expect(checker.canUseTool('FileWriteTool', {})).toBe(false);
    expect(checker.canUseTool('FileReadTool', {})).toBe(true);
  });

  it('should allow based on rules', () => {
    const checker = new PermissionChecker({
      mode: 'default',
      rules: [{ tool: 'BashTool', action: 'allow' }],
    });
    expect(checker.canUseTool('BashTool', {})).toBe(true);
  });

  it('should deny based on rules', () => {
    const checker = new PermissionChecker({
      mode: 'default',
      rules: [{ tool: 'BashTool', action: 'deny' }],
    });
    expect(checker.canUseTool('BashTool', {})).toBe(false);
  });

  it('should ask for unknown tools in default mode', () => {
    const checker = new PermissionChecker({ mode: 'default' });
    expect(checker.canUseTool('UnknownTool', {})).toBe('ask');
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// src/services/permissions/permissions.ts
export type PermissionMode = 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'auto';

export interface PermissionRule {
  tool: string;
  action: 'allow' | 'deny' | 'ask';
  pattern?: string;
  reason?: string;
}

export interface PermissionConfig {
  mode: PermissionMode;
  rules?: PermissionRule[];
}

export class PermissionChecker {
  private config: PermissionConfig;

  constructor(config: PermissionConfig) {
    this.config = config;
  }

  canUseTool(toolName: string, args: unknown): boolean | 'ask' {
    // Bypass mode: allow everything
    if (this.config.mode === 'bypassPermissions') return true;

    // Plan mode: only allow read-only tools
    if (this.config.mode === 'plan') {
      const readOnlyTools = ['FileReadTool', 'GlobTool', 'GrepTool', 'WebFetchTool'];
      return readOnlyTools.includes(toolName);
    }

    // Check rules
    const rules = this.config.rules ?? [];
    for (const rule of rules) {
      if (rule.tool === toolName || rule.tool === '*') {
        if (rule.action === 'allow') return true;
        if (rule.action === 'deny') return false;
      }
    }

    // acceptEdits mode: allow file edits
    if (this.config.mode === 'acceptEdits') {
      const editTools = ['FileReadTool', 'FileWriteTool', 'FileEditTool', 'GlobTool', 'GrepTool'];
      if (editTools.includes(toolName)) return true;
    }

    // Default: ask
    return 'ask';
  }

  getMode(): PermissionMode {
    return this.config.mode;
  }

  setMode(mode: PermissionMode): void {
    this.config.mode = mode;
  }
}
```

- [ ] **Step 3: Run test, commit**

---

### Task 2: Bash Security Analyzer (Simplified)

**Files:**
- Create: `mimo-code/src/utils/bash/bashSecurity.ts`
- Test: `mimo-code/tests/unit/bashSecurity.test.ts`

- [ ] **Step 1: Implement**

```typescript
// src/utils/bash/bashSecurity.ts
export interface SecurityAnalysis {
  safe: boolean;
  risk: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
}

const DANGEROUS_PATTERNS = [
  { pattern: /\brm\s+-rf?\b/, risk: 'critical' as const, reason: 'Recursive delete' },
  { pattern: /\bmkfs\b/, risk: 'critical' as const, reason: 'Format filesystem' },
  { pattern: /\bdd\b.*of=\/dev/, risk: 'critical' as const, reason: 'Write to device' },
  { pattern: />\s*\/dev\/sd/, risk: 'critical' as const, reason: 'Write to disk device' },
  { pattern: /\bchmod\s+777\b/, risk: 'high' as const, reason: 'World-writable permissions' },
  { pattern: /\bsudo\b/, risk: 'high' as const, reason: 'Elevated privileges' },
  { pattern: /\bcurl\b.*\|\s*bash/, risk: 'high' as const, reason: 'Pipe to shell' },
  { pattern: /\bwget\b.*\|\s*bash/, risk: 'high' as const, reason: 'Pipe to shell' },
  { pattern: /\bkill\b/, risk: 'medium' as const, reason: 'Process termination' },
  { pattern: /\bpkill\b/, risk: 'medium' as const, reason: 'Process termination' },
];

const READONLY_PATTERNS = [
  /^\s*echo\b/, /^\s*cat\b/, /^\s*ls\b/, /^\s*pwd\b/, /^\s*which\b/,
  /^\s*grep\b/, /^\s*find\b/, /^\s*wc\b/, /^\s*head\b/, /^\s*tail\b/,
  /^\s*git\s+(status|log|diff|show|branch)\b/,
];

export function analyzeCommand(command: string): SecurityAnalysis {
  const reasons: string[] = [];
  let maxRisk: SecurityAnalysis['risk'] = 'low';

  const riskOrder = { low: 0, medium: 1, high: 2, critical: 3 };

  for (const { pattern, risk, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      reasons.push(reason);
      if (riskOrder[risk] > riskOrder[maxRisk]) maxRisk = risk;
    }
  }

  const isReadOnly = READONLY_PATTERNS.some(p => p.test(command));
  if (isReadOnly && reasons.length === 0) {
    return { safe: true, risk: 'low', reasons: ['Read-only command'] };
  }

  return {
    safe: maxRisk === 'low' || maxRisk === 'medium',
    risk: maxRisk,
    reasons,
  };
}
```

- [ ] **Step 2: Run test, commit**

---

### Task 3: Plugin System Core

**Files:**
- Create: `mimo-code/src/plugins/events.ts`
- Create: `mimo-code/src/plugins/manager.ts`
- Test: `mimo-code/tests/unit/plugins.test.ts`

- [ ] **Step 1: Write test**

```typescript
// tests/unit/plugins.test.ts
import { describe, it, expect } from 'vitest';
import { EventBus } from '../../src/plugins/events.js';
import { PluginManager } from '../../src/plugins/manager.js';

describe('EventBus', () => {
  it('should emit and subscribe to events', () => {
    const bus = new EventBus();
    let received = '';
    bus.on('test', (data) => { received = data; });
    bus.emit('test', 'hello');
    expect(received).toBe('hello');
  });

  it('should support multiple listeners', () => {
    const bus = new EventBus();
    let count = 0;
    bus.on('test', () => { count++; });
    bus.on('test', () => { count++; });
    bus.emit('test');
    expect(count).toBe(2);
  });

  it('should unsubscribe', () => {
    const bus = new EventBus();
    let count = 0;
    const unsub = bus.on('test', () => { count++; });
    bus.emit('test');
    unsub();
    bus.emit('test');
    expect(count).toBe(1);
  });
});

describe('PluginManager', () => {
  it('should load and unload plugins', async () => {
    const manager = new PluginManager();
    let loaded = false;
    await manager.load({
      name: 'test-plugin',
      version: '1.0.0',
      description: 'Test',
      onLoad: async () => { loaded = true; },
      onUnload: async () => { loaded = false; },
      capabilities: [],
    });
    expect(loaded).toBe(true);
    expect(manager.getPlugins()).toHaveLength(1);
    await manager.unload('test-plugin');
    expect(loaded).toBe(false);
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// src/plugins/events.ts
type Listener = (...args: unknown[]) => void;

export class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, ...args: unknown[]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }
}
```

```typescript
// src/plugins/manager.ts
import { EventBus } from './events.js';

export interface Plugin {
  name: string;
  version: string;
  description: string;
  onLoad: (context: PluginContext) => Promise<void>;
  onUnload: () => Promise<void>;
  capabilities: string[];
}

export interface PluginContext {
  events: EventBus;
  registerCommand: (cmd: any) => void;
  registerTool: (tool: any) => void;
}

export class PluginManager {
  private plugins = new Map<string, Plugin>();
  private eventBus = new EventBus();

  async load(plugin: Plugin): Promise<void> {
    const context: PluginContext = {
      events: this.eventBus,
      registerCommand: () => {},
      registerTool: () => {},
    };
    await plugin.onLoad(context);
    this.plugins.set(plugin.name, plugin);
  }

  async unload(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin) {
      await plugin.onUnload();
      this.plugins.delete(name);
    }
  }

  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }
}
```

- [ ] **Step 3: Run test, commit**

---

### Task 4: MCP Client (Stub)

**Files:**
- Create: `mimo-code/src/services/mcp/client.ts`

- [ ] **Step 1: Implement MCP client stub**

```typescript
// src/services/mcp/client.ts
export interface MCPServerConfig {
  name: string;
  transport: 'stdio' | 'sse' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export class MCPClient {
  private config: MCPServerConfig;
  private connected = false;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // TODO: implement actual MCP protocol
    this.connected = true;
  }

  async listTools(): Promise<MCPToolDefinition[]> {
    if (!this.connected) throw new Error('Not connected');
    return [];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.connected) throw new Error('Not connected');
    throw new Error('MCP tool execution not yet implemented');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
```

- [ ] **Step 2: Commit**

---

### Task 5: Anthropic Adapter

**Files:**
- Create: `mimo-code/src/services/api/adapters/anthropic.ts`
- Test: `mimo-code/tests/unit/api/anthropic-adapter.test.ts`

- [ ] **Step 1: Implement**

```typescript
// src/services/api/adapters/anthropic.ts
import type { ModelAdapter, ModelRequest, ModelResponse, StreamChunk } from '../../../types/api.js';
import type { Message } from '../../../types/message.js';

export class AnthropicAdapter implements ModelAdapter {
  readonly name = 'anthropic';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  supports(model: string): boolean {
    return model.startsWith('claude-');
  }

  countTokens(messages: Message[]): number {
    return messages.reduce((sum, m) => sum + (typeof m.content === 'string' ? m.content.length : 0) / 4, 0);
  }

  async *streamChat(request: ModelRequest): AsyncGenerator<StreamChunk> {
    // Convert messages to Anthropic format
    const anthropicMessages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'tool' ? 'user' : m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }));

    const body = {
      model: request.model,
      messages: anthropicMessages,
      system: request.system,
      max_tokens: request.maxTokens ?? 4096,
      stream: true,
    };

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        yield { type: 'error', content: `Anthropic API error: ${response.status}` };
        return;
      }

      // Parse SSE stream
      const reader = response.body?.getReader();
      if (!reader) { yield { type: 'error', content: 'No response body' }; return; }
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield { type: 'text', content: parsed.delta.text };
            }
            if (parsed.type === 'message_stop') {
              yield { type: 'done' };
            }
          } catch {}
        }
      }
      reader.releaseLock();
    } catch (error) {
      yield { type: 'error', content: error instanceof Error ? error.message : String(error) };
    }
  }

  async chat(request: ModelRequest): Promise<ModelResponse> {
    const chunks: StreamChunk[] = [];
    for await (const chunk of this.streamChat(request)) {
      chunks.push(chunk);
    }
    const text = chunks.filter(c => c.type === 'text').map(c => c.content).join('');
    return { content: text, finishReason: 'stop' };
  }
}
```

- [ ] **Step 2: Commit**

---

### Task 6: Wire Permissions into REPL

**Files:**
- Modify: `mimo-code/src/screens/REPL.tsx`

- [ ] **Step 1: Update REPL to check permissions before tool execution**

Add permission checking to the query loop. When a tool call comes through, check permissions before executing.

- [ ] **Step 2: Commit**

---

### Task 7: Final Verification

- [ ] **Step 1: Run all tests**

Run: `cd mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Commit any fixes**
