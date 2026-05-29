# Phase 3: Extensibility Framework Implementation Plan

**Goal:** Add Skills, Hook, MCP, and Plugin systems for extensibility

**Architecture:** Skills load from disk with frontmatter parsing. Hooks provide event-driven automation. MCP enables external tool servers. Plugins combine all three.

---

## Task 1: Skills System

**Files:**
- Create: `src/skills/types.ts` — Skill interface
- Create: `src/skills/loader.ts` — Load skills from `.mimo/skills/`
- Create: `src/skills/builtin/remember.ts` — Built-in remember skill
- Create: `src/skills/builtin/simplify.ts` — Built-in simplify skill
- Test: `tests/unit/skills/loader.test.ts`

### Implementation

```ts
// src/skills/types.ts
export interface Skill {
  name: string;
  description: string;
  aliases?: string[];
  allowedTools?: string[];
  getPromptForCommand(args: string): string;
}

// src/skills/loader.ts
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Skill } from './types.js';

function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter: Record<string, string> = {};
  for (const line of match[1]!.split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      frontmatter[key.trim()] = rest.join(':').trim();
    }
  }
  return { frontmatter, body: match[2] ?? '' };
}

export async function loadSkillsFromDir(dir: string): Promise<Skill[]> {
  try {
    const files = await readdir(dir);
    const skills: Skill[] = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const content = await readFile(join(dir, file), 'utf-8');
      const { frontmatter, body } = parseFrontmatter(content);

      skills.push({
        name: frontmatter['name'] ?? file.replace('.md', ''),
        description: frontmatter['description'] ?? '',
        aliases: frontmatter['aliases']?.split(',').map(s => s.trim()),
        allowedTools: frontmatter['allowedTools']?.split(',').map(s => s.trim()),
        getPromptForCommand: () => body,
      });
    }

    return skills;
  } catch {
    return [];
  }
}
```

### Tests

```ts
// tests/unit/skills/loader.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadSkillsFromDir } from '../../../src/skills/loader.js';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('loadSkillsFromDir', () => {
  let dir: string;

  beforeEach(async () => {
    dir = join(tmpdir(), `skills-test-${Date.now()}`);
    await mkdir(dir, { recursive: true });
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('loads skills from markdown files', async () => {
    await writeFile(join(dir, 'test-skill.md'),
      '---\nname: test\ndescription: A test skill\n---\nThis is the prompt.');
    const skills = await loadSkillsFromDir(dir);
    expect(skills).toHaveLength(1);
    expect(skills[0]!.name).toBe('test');
    expect(skills[0]!.description).toBe('A test skill');
    expect(skills[0]!.getPromptForCommand('')).toBe('This is the prompt.');
  });

  it('returns empty for non-existent dir', async () => {
    const skills = await loadSkillsFromDir('/nonexistent');
    expect(skills).toHaveLength(0);
  });

  it('skips non-md files', async () => {
    await writeFile(join(dir, 'readme.txt'), 'not a skill');
    const skills = await loadSkillsFromDir(dir);
    expect(skills).toHaveLength(0);
  });
});
```

---

## Task 2: Hook System

**Files:**
- Create: `src/hooks/types.ts` — Hook event types
- Create: `src/hooks/registry.ts` — Hook registration and execution
- Test: `tests/unit/hooks/registry.test.ts`

### Implementation

```ts
// src/hooks/types.ts
export type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'SessionStart'
  | 'SessionEnd'
  | 'Compact'
  | 'PermissionRequest';

export interface Hook {
  event: HookEvent;
  type: 'command' | 'agent';
  command?: string;  // For type='command'
  if?: string;       // Condition filter
  timeout?: number;
  async?: boolean;
}

// src/hooks/registry.ts
import type { Hook, HookEvent } from './types.js';
import { spawn } from 'node:child_process';

export class HookRegistry {
  private hooks = new Map<HookEvent, Hook[]>();

  register(hook: Hook): void {
    const existing = this.hooks.get(hook.event) ?? [];
    existing.push(hook);
    this.hooks.set(hook.event, existing);
  }

  getHooks(event: HookEvent): Hook[] {
    return this.hooks.get(event) ?? [];
  }

  async execute(event: HookEvent, context: Record<string, unknown>): Promise<string[]> {
    const hooks = this.getHooks(event);
    const results: string[] = [];

    for (const hook of hooks) {
      if (hook.type === 'command' && hook.command) {
        const result = await this.executeCommand(hook.command, context, hook.timeout);
        results.push(result);
      }
    }

    return results;
  }

  private executeCommand(command: string, context: Record<string, unknown>, timeout?: number): Promise<string> {
    return new Promise((resolve) => {
      const proc = spawn('bash', ['-c', command], {
        env: { ...process.env, MIMO_CONTEXT: JSON.stringify(context) },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const timer = setTimeout(() => proc.kill('SIGTERM'), timeout ?? 10000);

      let output = '';
      proc.stdout.on('data', (d: Buffer) => output += d.toString());
      proc.stderr.on('data', (d: Buffer) => output += d.toString());

      proc.on('close', () => {
        clearTimeout(timer);
        resolve(output);
      });

      proc.on('error', () => {
        clearTimeout(timer);
        resolve('');
      });

      proc.stdin.end();
    });
  }
}
```

### Tests

```ts
// tests/unit/hooks/registry.test.ts
import { describe, it, expect } from 'vitest';
import { HookRegistry } from '../../../src/hooks/registry.js';

describe('HookRegistry', () => {
  it('registers and retrieves hooks', () => {
    const registry = new HookRegistry();
    registry.register({ event: 'PreToolUse', type: 'command', command: 'echo hello' });
    expect(registry.getHooks('PreToolUse')).toHaveLength(1);
    expect(registry.getHooks('PostToolUse')).toHaveLength(0);
  });

  it('executes command hooks', async () => {
    const registry = new HookRegistry();
    registry.register({ event: 'SessionStart', type: 'command', command: 'echo "session started"' });
    const results = await registry.execute('SessionStart', {});
    expect(results[0]).toContain('session started');
  });

  it('handles empty hooks gracefully', async () => {
    const registry = new HookRegistry();
    const results = await registry.execute('PreToolUse', {});
    expect(results).toHaveLength(0);
  });
});
```

---

## Task 3: MCP Complete Implementation

**Files:**
- Rewrite: `src/services/mcp/client.ts` — Full MCP client
- Create: `src/services/mcp/transport.ts` — stdio transport
- Test: `tests/unit/mcp/client.test.ts`

### Implementation

```ts
// src/services/mcp/transport.ts
import { spawn, type ChildProcess } from 'node:child_process';

export interface McpTransport {
  send(message: string): void;
  onMessage(callback: (message: string) => void): void;
  close(): void;
}

export class StdioTransport implements McpTransport {
  private proc: ChildProcess;
  private messageCallback: ((message: string) => void) | null = null;
  private buffer = '';

  constructor(command: string, args: string[] = []) {
    this.proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.proc.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.trim()) {
          this.messageCallback?.(line);
        }
      }
    });
  }

  send(message: string): void {
    this.proc.stdin?.write(message + '\n');
  }

  onMessage(callback: (message: string) => void): void {
    this.messageCallback = callback;
  }

  close(): void {
    this.proc.kill('SIGTERM');
  }
}
```

```ts
// src/services/mcp/client.ts — rewrite
import type { McpTransport } from './transport.js';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpResource {
  uri: string;
  name: string;
  mimeType?: string;
}

export class McpClient {
  private transport: McpTransport;
  private requestId = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private tools: McpTool[] = [];

  constructor(transport: McpTransport) {
    this.transport = transport;
    this.transport.onMessage((msg) => this.handleMessage(msg));
  }

  async initialize(): Promise<void> {
    await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'mimo-code', version: '1.0.0' },
    });
    this.transport.send(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }));
  }

  async listTools(): Promise<McpTool[]> {
    const result = await this.request('tools/list', {}) as { tools: McpTool[] };
    this.tools = result.tools ?? [];
    return this.tools;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    return this.request('tools/call', { name, arguments: args });
  }

  async listResources(): Promise<McpResource[]> {
    const result = await this.request('resources/list', {}) as { resources: McpResource[] };
    return result.resources ?? [];
  }

  async readResource(uri: string): Promise<unknown> {
    return this.request('resources/read', { uri });
  }

  getTools(): McpTool[] {
    return this.tools;
  }

  close(): void {
    this.transport.close();
  }

  private request(method: string, params: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pending.set(id, { resolve, reject });
      this.transport.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
    });
  }

  private handleMessage(raw: string): void {
    try {
      const msg = JSON.parse(raw);
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message));
        } else {
          resolve(msg.result);
        }
      }
    } catch {
      // Ignore malformed messages
    }
  }
}
```

### Tests

```ts
// tests/unit/mcp/client.test.ts
import { describe, it, expect, vi } from 'vitest';
import { McpClient } from '../../../src/services/mcp/client.js';
import type { McpTransport } from '../../../src/services/mcp/transport.js';

function createMockTransport(): McpTransport & { simulateMessage: (msg: string) => void } {
  let callback: ((msg: string) => void) | null = null;
  return {
    send: vi.fn(),
    onMessage: (cb) => { callback = cb; },
    close: vi.fn(),
    simulateMessage: (msg: string) => callback?.(msg),
  };
}

describe('McpClient', () => {
  it('sends initialize request', async () => {
    const transport = createMockTransport();
    const client = new McpClient(transport);

    setTimeout(() => {
      transport.simulateMessage(JSON.stringify({
        jsonrpc: '2.0', id: 1,
        result: { protocolVersion: '2024-11-05', capabilities: {}, serverInfo: { name: 'test' } },
      }));
    }, 10);

    await client.initialize();
    expect(transport.send).toHaveBeenCalled();
  });

  it('lists tools', async () => {
    const transport = createMockTransport();
    const client = new McpClient(transport);

    setTimeout(() => {
      transport.simulateMessage(JSON.stringify({
        jsonrpc: '2.0', id: 1,
        result: { tools: [{ name: 'TestTool', description: 'test', inputSchema: {} }] },
      }));
    }, 10);

    const tools = await client.listTools();
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('TestTool');
  });

  it('handles error responses', async () => {
    const transport = createMockTransport();
    const client = new McpClient(transport);

    setTimeout(() => {
      transport.simulateMessage(JSON.stringify({
        jsonrpc: '2.0', id: 1,
        error: { message: 'Method not found' },
      }));
    }, 10);

    await expect(client.listTools()).rejects.toThrow('Method not found');
  });
});
```

---

## Task 4: Plugin System

**Files:**
- Create: `src/plugins/loader.ts` — Plugin discovery
- Enhance: `src/plugins/manager.ts` — Plugin lifecycle
- Test: `tests/unit/plugins/loader.test.ts`

### Implementation

```ts
// src/plugins/loader.ts
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  main: string;
  capabilities: ('command' | 'tool' | 'hook' | 'theme')[];
}

export async function discoverPlugins(nodeModulesDir: string): Promise<PluginManifest[]> {
  try {
    const dirs = await readdir(nodeModulesDir);
    const plugins: PluginManifest[] = [];

    for (const dir of dirs) {
      if (!dir.startsWith('mimo-plugin-') && !dir.startsWith('@mimo-code/plugin-')) continue;
      try {
        const manifestPath = join(nodeModulesDir, dir, 'manifest.json');
        const manifest = await import(manifestPath, { with: { type: 'json' } });
        plugins.push(manifest.default ?? manifest);
      } catch {
        // Skip invalid plugins
      }
    }

    return plugins;
  } catch {
    return [];
  }
}
```

### Tests

```ts
// tests/unit/plugins/loader.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { discoverPlugins } from '../../../src/plugins/loader.js';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('discoverPlugins', () => {
  let dir: string;

  beforeEach(async () => {
    dir = join(tmpdir(), `plugins-test-${Date.now()}`);
    await mkdir(join(dir, 'mimo-plugin-test'), { recursive: true });
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('discovers plugins with valid manifest', async () => {
    await writeFile(
      join(dir, 'mimo-plugin-test', 'manifest.json'),
      JSON.stringify({
        name: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        main: 'index.js',
        capabilities: ['command'],
      }),
    );

    const plugins = await discoverPlugins(dir);
    expect(plugins).toHaveLength(1);
    expect(plugins[0]!.name).toBe('test-plugin');
  });

  it('returns empty for non-existent dir', async () => {
    const plugins = await discoverPlugins('/nonexistent');
    expect(plugins).toHaveLength(0);
  });

  it('skips non-plugin directories', async () => {
    await mkdir(join(dir, 'some-other-package'), { recursive: true });
    const plugins = await discoverPlugins(dir);
    expect(plugins).toHaveLength(0);
  });
});
```

---

## Task 5: Final Integration

- [ ] Run full test suite: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run`
- [ ] Commit: `git add -A && git commit -m "feat: Phase 3 complete — Skills, Hooks, MCP, Plugins"`
