# Phase 5: Intelligent Features Implementation Plan

**Goal:** Add auto-memory, background tasks, cost tracking, thinking mode, and fast mode

---

## Task 1: Auto-Memory System

**Files:** `src/memdir/types.ts`, `src/memdir/store.ts`, `src/memdir/discovery.ts`, `tests/unit/memdir/store.test.ts`

### Types

```ts
// types.ts
export type MemoryType = 'user' | 'feedback' | 'project' | 'reference';

export interface MemoryEntry {
  name: string;
  type: MemoryType;
  description: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}
```

### Store

```ts
// store.ts
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type { MemoryEntry, MemoryType } from './types.js';

const MEMORY_DIR_NAME = 'memories';
const MAX_MEMORY_LINES = 200;

export class MemoryStore {
  private dir: string;

  constructor(baseDir: string) {
    this.dir = join(baseDir, MEMORY_DIR_NAME);
  }

  async init(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  async save(entry: MemoryEntry): Promise<void> {
    await this.init();
    const filePath = join(this.dir, `${entry.name}.md`);
    const frontmatter = [
      '---',
      `name: ${entry.name}`,
      `description: ${entry.description}`,
      `metadata:`,
      `  type: ${entry.type}`,
      '---',
    ].join('\n');
    const content = `${frontmatter}\n\n${entry.content}`;
    await writeFile(filePath, content, 'utf-8');
  }

  async load(name: string): Promise<MemoryEntry | null> {
    try {
      const filePath = join(this.dir, `${name}.md`);
      const raw = await readFile(filePath, 'utf-8');
      return this.parseMemoryFile(name, raw);
    } catch {
      return null;
    }
  }

  async list(): Promise<MemoryEntry[]> {
    try {
      await this.init();
      const files = await readdir(this.dir);
      const entries: MemoryEntry[] = [];
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const name = file.replace('.md', '');
        const entry = await this.load(name);
        if (entry) entries.push(entry);
      }
      return entries;
    } catch {
      return [];
    }
  }

  async delete(name: string): Promise<void> {
    try {
      await unlink(join(this.dir, `${name}.md`));
    } catch {}
  }

  private parseMemoryFile(name: string, raw: string): MemoryEntry | null {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return null;

    const fm = match[1] ?? '';
    const content = match[2]?.trim() ?? '';
    const descMatch = fm.match(/description:\s*(.*)/);
    const typeMatch = fm.match(/type:\s*(\w+)/);

    return {
      name,
      type: (typeMatch?.[1] as MemoryType) ?? 'project',
      description: descMatch?.[1]?.trim() ?? '',
      content,
      createdAt: 0,
      updatedAt: 0,
    };
  }
}
```

---

## Task 2: Background Task System

**Files:** `src/tasks/types.ts`, `src/tasks/manager.ts`, `tests/unit/tasks/manager.test.ts`

### Types

```ts
// types.ts
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'killed';
export type TaskType = 'shell' | 'agent';

export interface TaskState {
  id: string;
  type: TaskType;
  status: TaskStatus;
  description: string;
  startTime: number;
  endTime?: number;
  outputFile?: string;
  error?: string;
}
```

### Manager

```ts
// manager.ts
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { TaskState, TaskType } from './types.js';

export class TaskManager {
  private tasks = new Map<string, TaskState>();
  private processes = new Map<string, ReturnType<typeof spawn>>();
  private nextId = 1;
  private outputDir: string;

  constructor(outputDir?: string) {
    this.outputDir = outputDir ?? join(tmpdir(), 'mimo-tasks');
  }

  async createShellTask(command: string, description: string): Promise<TaskState> {
    const id = `task-${this.nextId++}`;
    const outputFile = join(this.outputDir, `${id}.txt`);
    await mkdir(this.outputDir, { recursive: true });

    const state: TaskState = {
      id,
      type: 'shell',
      status: 'running',
      description,
      startTime: Date.now(),
      outputFile,
    };

    this.tasks.set(id, state);

    const proc = spawn('bash', ['-c', command], { stdio: ['pipe', 'pipe', 'pipe'] });
    this.processes.set(id, proc);

    let output = '';
    proc.stdout.on('data', (d: Buffer) => { output += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { output += d.toString(); });

    proc.on('close', async (code) => {
      state.status = code === 0 ? 'completed' : 'failed';
      state.endTime = Date.now();
      state.error = code !== 0 ? `Exit code ${code}` : undefined;
      await writeFile(outputFile, output, 'utf-8');
      this.processes.delete(id);
    });

    proc.on('error', async (err) => {
      state.status = 'failed';
      state.endTime = Date.now();
      state.error = err.message;
      this.processes.delete(id);
    });

    return state;
  }

  getTask(id: string): TaskState | undefined {
    return this.tasks.get(id);
  }

  listTasks(): TaskState[] {
    return Array.from(this.tasks.values());
  }

  killTask(id: string): boolean {
    const proc = this.processes.get(id);
    if (!proc) return false;
    proc.kill('SIGTERM');
    const state = this.tasks.get(id);
    if (state) {
      state.status = 'killed';
      state.endTime = Date.now();
    }
    this.processes.delete(id);
    return true;
  }
}
```

---

## Task 3: Cost Tracking

**Files:** `src/cost-tracker.ts`, `src/commands/cost.ts`, `tests/unit/cost-tracker.test.ts`

```ts
// cost-tracker.ts
import type { TokenUsage } from './types/message.js';

interface ModelPricing {
  inputPer1k: number;
  outputPer1k: number;
  cacheReadPer1k?: number;
}

const PRICING: Record<string, ModelPricing> = {
  'mimo-large':  { inputPer1k: 0.003, outputPer1k: 0.015 },
  'mimo-medium': { inputPer1k: 0.001, outputPer1k: 0.005 },
  'mimo-small':  { inputPer1k: 0.0003, outputPer1k: 0.001 },
  'gpt-4o':      { inputPer1k: 0.0025, outputPer1k: 0.01 },
  'gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  'claude-sonnet-4-20250514': { inputPer1k: 0.003, outputPer1k: 0.015 },
};

export interface CostEntry {
  model: string;
  usage: TokenUsage;
  costUSD: number;
  timestamp: number;
}

export class CostTracker {
  private entries: CostEntry[] = [];

  record(model: string, usage: TokenUsage): void {
    const costUSD = this.calculateCost(model, usage);
    this.entries.push({ model, usage, costUSD, timestamp: Date.now() });
  }

  calculateCost(model: string, usage: TokenUsage): number {
    const pricing = PRICING[model] ?? PRICING['mimo-large']!;
    const inputCost = (usage.inputTokens / 1000) * pricing.inputPer1k;
    const outputCost = (usage.outputTokens / 1000) * pricing.outputPer1k;
    const cacheCost = usage.cacheReadTokens ? (usage.cacheReadTokens / 1000) * (pricing.cacheReadPer1k ?? pricing.inputPer1k * 0.1) : 0;
    return inputCost + outputCost + cacheCost;
  }

  getTotalCost(): number {
    return this.entries.reduce((sum, e) => sum + e.costUSD, 0);
  }

  getCostByModel(): Record<string, number> {
    const byModel: Record<string, number> = {};
    for (const entry of this.entries) {
      byModel[entry.model] = (byModel[entry.model] ?? 0) + entry.costUSD;
    }
    return byModel;
  }

  getEntries(): CostEntry[] {
    return [...this.entries];
  }
}
```

---

## Task 4: Thinking Mode

**Files:** `src/query/thinking.ts`, `tests/unit/query/thinking.test.ts`

```ts
// thinking.ts
export type ThinkingMode = 'off' | 'on' | 'adaptive';

export interface ThinkingConfig {
  mode: ThinkingMode;
  budgetTokens?: number;
}

export function shouldEnableThinking(config: ThinkingConfig, prompt: string): boolean {
  if (config.mode === 'on') return true;
  if (config.mode === 'off') return false;

  // Adaptive: enable for complex tasks
  const complexityIndicators = [
    /\b(implement|design|architect|refactor|debug|analyze|optimize)\b/i,
    /\b(explain how|step by step|think through|consider)\b/i,
    /\b(multiple|several|complex|difficult|tricky)\b/i,
    /```[\s\S]{200,}```/,  // Long code blocks
  ];

  return complexityIndicators.some(re => re.test(prompt));
}

export function getThinkingBudget(config: ThinkingConfig): number | undefined {
  return config.budgetTokens;
}
```

---

## Task 5: Fast Mode

**Files:** `src/commands/fast.ts`, `tests/unit/query/fastMode.test.ts`

```ts
// commands/fast.ts
import type { Command } from '../commands.js';

export function createFastCommand(getModel: () => string, setModel: (m: string) => void, defaultModel: string, fastModel: string): Command {
  return {
    name: 'fast',
    aliases: ['f'],
    description: 'Toggle fast mode (use lighter model)',
    isEnabled: () => true,
    call: async () => {
      const current = getModel();
      if (current === fastModel) {
        setModel(defaultModel);
        return `⚡ Fast mode OFF — using ${defaultModel}`;
      } else {
        setModel(fastModel);
        return `⚡ Fast mode ON — using ${fastModel}`;
      }
    },
  };
}
```

---

## Final Integration

- Run full test suite
- Commit all Phase 5 changes
