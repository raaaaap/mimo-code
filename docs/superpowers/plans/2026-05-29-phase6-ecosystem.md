# Phase 6: Ecosystem Integration Implementation Plan

**Goal:** Add MCP server, Agent SDK, session persistence, migrations, worktree, sandbox, telemetry, policy, and LSP

---

## Batch 1: Simple Infrastructure (6 features)

### 1. Data Migration

```ts
// src/migrations/types.ts
export interface Migration {
  version: string;
  description: string;
  up(): Promise<void>;
  down(): Promise<void>;
}

// src/migrations/registry.ts
export class MigrationRegistry {
  private migrations: Migration[] = [];
  register(migration: Migration): void { this.migrations.push(migration); }
  async runAll(): Promise<void> { for (const m of this.migrations) await m.up(); }
  async rollback(): Promise<void> { for (const m of this.migrations.reverse()) await m.down(); }
}
```

### 2. Worktree Management

```ts
// src/worktree/manager.ts
import { execSync } from 'node:child_process';

export class WorktreeManager {
  create(name: string): string {
    const path = `.worktrees/${name}`;
    execSync(`git worktree add ${path} -b ${name}`, { cwd: process.cwd() });
    return path;
  }

  remove(name: string): void {
    execSync(`git worktree remove .worktrees/${name}`, { cwd: process.cwd() });
    execSync(`git branch -D ${name}`, { cwd: process.cwd() });
  }

  list(): string[] {
    const output = execSync('git worktree list --porcelain', { cwd: process.cwd(), encoding: 'utf-8' });
    return output.split('\n').filter(l => l.startsWith('worktree ')).map(l => l.slice(9));
  }
}
```

### 3. Sandbox

```ts
// src/sandbox/config.ts
export interface SandboxConfig {
  network: { allowedDomains: string[]; blockedDomains: string[] };
  filesystem: { allowedWritePaths: string[]; readOnly: boolean };
  enabled: boolean;
}

export function isDomainAllowed(domain: string, config: SandboxConfig): boolean {
  if (!config.enabled) return true;
  if (config.network.blockedDomains.includes(domain)) return false;
  return config.network.allowedDomains.includes(domain) || config.network.allowedDomains.includes('*');
}
```

### 4. Telemetry

```ts
// src/telemetry/counter.ts
export class TelemetryCounter {
  private counts = new Map<string, number>();
  increment(name: string, value = 1): void {
    this.counts.set(name, (this.counts.get(name) ?? 0) + value);
  }
  get(name: string): number { return this.counts.get(name) ?? 0; }
  getAll(): Record<string, number> { return Object.fromEntries(this.counts); }
  reset(): void { this.counts.clear(); }
}
```

### 5. Policy Limits

```ts
// src/services/policyLimits/types.ts
export interface PolicyLimits {
  maxTokensPerTurn?: number;
  maxTurns?: number;
  allowedTools?: string[];
  deniedTools?: string[];
  allowedModels?: string[];
}

export function checkToolAllowed(toolName: string, policy: PolicyLimits): boolean {
  if (policy.deniedTools?.includes(toolName)) return false;
  if (policy.allowedTools) return policy.allowedTools.includes(toolName);
  return true;
}
```

### 6. LSP Client

```ts
// src/services/lsp/client.ts
export interface LspLocation {
  file: string;
  line: number;
  column: number;
}

export class LspClient {
  async findDefinition(file: string, line: number, column: number): Promise<LspLocation | null> {
    // Stub — requires actual LSP server connection
    return null;
  }

  async getDiagnostics(file: string): Promise<Array<{ line: number; message: string; severity: string }>> {
    return [];
  }

  async format(file: string): Promise<string | null> {
    return null;
  }
}
```

---

## Batch 2: Complex Features (4 features)

### 7. MCP Server Mode

```ts
// src/entrypoints/mcp.ts
import { createDefaultRegistry } from '../tools.js';

export async function runMcpServer(): Promise<void> {
  const registry = createDefaultRegistry();
  const tools = registry.getAll();

  process.stdin.setEncoding('utf-8');
  let buffer = '';

  process.stdin.on('data', async (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const request = JSON.parse(line);
        const response = await handleRequest(request, registry);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (e) {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32700, message: 'Parse error' },
        }) + '\n');
      }
    }
  });
}
```

### 8. Agent SDK

```ts
// src/entrypoints/sdk/types.ts
export interface SdkRequest {
  type: 'query' | 'cancel' | 'permission_response';
  payload: unknown;
}

export interface SdkResponse {
  type: 'text' | 'tool_use' | 'permission_request' | 'done' | 'error';
  payload: unknown;
}
```

### 9. Session Persistence

```ts
// src/session/store.ts
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Message } from '../types/message.js';

export interface SessionData {
  id: string;
  messages: Message[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

export class SessionStore {
  private dir: string;
  constructor(baseDir: string) { this.dir = join(baseDir, 'sessions'); }

  async save(session: SessionData): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, `${session.id}.json`), JSON.stringify(session, null, 2));
  }

  async load(id: string): Promise<SessionData | null> {
    try {
      return JSON.parse(await readFile(join(this.dir, `${id}.json`), 'utf-8'));
    } catch { return null; }
  }

  async list(): Promise<SessionData[]> {
    try {
      await mkdir(this.dir, { recursive: true });
      const files = (await readdir(this.dir)).filter(f => f.endsWith('.json'));
      const sessions: SessionData[] = [];
      for (const f of files) {
        try { sessions.push(JSON.parse(await readFile(join(this.dir, f), 'utf-8'))); } catch {}
      }
      return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch { return []; }
  }
}
```

### 10. Settings Sync

```ts
// src/utils/settings/sync.ts
export type SettingsSource = 'user' | 'project' | 'local' | 'managed' | 'flag';

export interface SettingsLayer {
  source: SettingsSource;
  settings: Record<string, unknown>;
}

export function mergeSettings(layers: SettingsLayer[]): Record<string, unknown> {
  const priority: SettingsSource[] = ['user', 'project', 'local', 'managed', 'flag'];
  const result: Record<string, unknown> = {};

  for (const source of priority) {
    const layer = layers.find(l => l.source === source);
    if (layer) Object.assign(result, layer.settings);
  }

  return result;
}
```

---

## Tests

For each module, create a corresponding test file:
- `tests/unit/migrations/registry.test.ts`
- `tests/unit/worktree/manager.test.ts`
- `tests/unit/sandbox/config.test.ts`
- `tests/unit/telemetry/counter.test.ts`
- `tests/unit/policyLimits/checker.test.ts`
- `tests/unit/session/store.test.ts`
- `tests/unit/settings/sync.test.ts`
