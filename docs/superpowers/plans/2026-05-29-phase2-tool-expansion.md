# Phase 2: Tool Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 new tools: AgentTool, WebSearchTool, NotebookEditTool, AskUserQuestionTool, PowerShellTool

**Architecture:** Each tool follows the existing `buildTool()` pattern in `src/tools/`. AgentTool creates sub-QueryEngine instances. WebSearchTool integrates a search API. NotebookEditTool parses .ipynb JSON. AskUserQuestionTool uses REPL prompts. PowerShellTool spawns PowerShell processes.

**Tech Stack:** TypeScript 5.x, Vitest, Zod, existing tool patterns

---

## Task 1: WebSearchTool

**Files:**
- Create: `src/tools/WebSearchTool/WebSearchTool.ts`
- Test: `tests/unit/tools/WebSearchTool.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/tools/WebSearchTool.test.ts
import { describe, it, expect, vi } from 'vitest';
import { WebSearchTool } from '../../../src/tools/WebSearchTool/WebSearchTool.js';

describe('WebSearchTool', () => {
  it('has correct name and properties', () => {
    const tool = WebSearchTool();
    expect(tool.name).toBe('WebSearchTool');
    expect(tool.isReadOnly()).toBe(true);
    expect(tool.isConcurrencySafe()).toBe(true);
  });

  it('validates input schema', () => {
    const tool = WebSearchTool();
    const result = tool.inputSchema.safeParse({ query: 'test search' });
    expect(result.success).toBe(true);
  });

  it('rejects empty query', () => {
    const tool = WebSearchTool();
    const result = tool.inputSchema.safeParse({ query: '' });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Implement WebSearchTool**

```ts
// src/tools/WebSearchTool/WebSearchTool.ts
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  query: z.string().min(1).describe('Search query'),
  count: z.number().optional().default(5).describe('Number of results (1-10)'),
});

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function searchWeb(query: string, count: number): Promise<SearchResult[]> {
  // Use DuckDuckGo HTML API (no key required)
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 mimo-code/1.0' },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  const html = await response.text();

  // Parse results from DuckDuckGo HTML
  const results: SearchResult[] = [];
  const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < count) {
    const url = match[1]?.trim();
    const title = match[2]?.trim().replace(/<[^>]*>/g, '');
    const snippet = match[3]?.trim().replace(/<[^>]*>/g, '');
    if (url && title) {
      results.push({ title, url, snippet: snippet ?? '' });
    }
  }

  // Fallback: try simpler regex if first pattern fails
  if (results.length === 0) {
    const simpleRegex = /<a[^>]*rel="nofollow"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
    while ((match = simpleRegex.exec(html)) !== null && results.length < count) {
      const url = match[1]?.trim();
      const title = match[2]?.trim();
      if (url && title && url.startsWith('http')) {
        results.push({ title, url, snippet: '' });
      }
    }
  }

  return results;
}

export const WebSearchTool = () => buildTool({
  name: 'WebSearchTool',
  aliases: ['websearch', 'search'],
  inputSchema,
  isReadOnly: () => true,
  isConcurrencySafe: () => true,
  description: async () => 'Search the web and return titles, URLs, and snippets.',
  prompt: () => 'Search the web. Returns results with titles, URLs, and snippets.',
  call: async (args) => {
    try {
      const results = await searchWeb(args.query, args.count ?? 5);
      if (results.length === 0) {
        return { toolUseId: '', name: 'WebSearchTool', result: 'No results found.' };
      }
      const formatted = results.map((r, i) =>
        `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`,
      ).join('\n\n');
      return { toolUseId: '', name: 'WebSearchTool', result: formatted };
    } catch (error) {
      return {
        toolUseId: '',
        name: 'WebSearchTool',
        result: '',
        error: error instanceof Error ? error.message : String(error),
        isError: true,
      };
    }
  },
});
```

- [ ] **Step 3: Run tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/tools/WebSearchTool.test.ts`

- [ ] **Step 4: Register in tool registry**

Read `src/tools.ts` and add:
```ts
import { WebSearchTool } from './tools/WebSearchTool/WebSearchTool.js';
// In createDefaultRegistry():
registry.register(WebSearchTool());
```

- [ ] **Step 5: Commit**

```bash
cd c:/Users/rap/mimo-code/mimo-code
git add src/tools/WebSearchTool/ tests/unit/tools/WebSearchTool.test.ts src/tools.ts
git commit -m "feat(tools): add WebSearchTool with DuckDuckGo integration"
```

---

## Task 2: NotebookEditTool

**Files:**
- Create: `src/tools/NotebookEditTool/NotebookEditTool.ts`
- Test: `tests/unit/tools/NotebookEditTool.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/tools/NotebookEditTool.test.ts
import { describe, it, expect } from 'vitest';
import { NotebookEditTool } from '../../../src/tools/NotebookEditTool/NotebookEditTool.js';

describe('NotebookEditTool', () => {
  it('has correct name', () => {
    const tool = NotebookEditTool();
    expect(tool.name).toBe('NotebookEditTool');
  });

  it('validates input schema', () => {
    const tool = NotebookEditTool();
    const result = tool.inputSchema.safeParse({
      notebookPath: 'test.ipynb',
      cellType: 'code',
      cellSource: 'print("hello")',
      editMode: 'insert',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const tool = NotebookEditTool();
    const result = tool.inputSchema.safeParse({ notebookPath: 'test.ipynb' });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Implement NotebookEditTool**

```ts
// src/tools/NotebookEditTool/NotebookEditTool.ts
import { z } from 'zod';
import { readFile, writeFile } from 'node:fs/promises';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  notebookPath: z.string().describe('Path to .ipynb file'),
  editMode: z.enum(['insert', 'delete', 'replace']).describe('Edit mode'),
  cellIndex: z.number().optional().describe('Cell index (0-based)'),
  cellType: z.enum(['code', 'markdown']).optional().describe('Cell type'),
  cellSource: z.string().optional().describe('Cell source content'),
});

interface NotebookCell {
  cell_type: string;
  source: string[];
  metadata: Record<string, unknown>;
  outputs?: unknown[];
  execution_count?: number | null;
}

interface Notebook {
  cells: NotebookCell[];
  metadata: Record<string, unknown>;
  nbformat: number;
  nbformat_minor: number;
}

async function readNotebook(path: string): Promise<Notebook> {
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content);
}

async function writeNotebook(path: string, notebook: Notebook): Promise<void> {
  await writeFile(path, JSON.stringify(notebook, null, 1), 'utf-8');
}

export const NotebookEditTool = () => buildTool({
  name: 'NotebookEditTool',
  aliases: ['notebook', 'ipynb'],
  inputSchema,
  isDestructive: () => true,
  description: async () => 'Edit Jupyter notebook cells (insert, delete, replace).',
  prompt: () => 'Edit .ipynb notebook files. Supports insert/delete/replace of code and markdown cells.',
  call: async (args) => {
    try {
      const notebook = await readNotebook(args.notebookPath);

      if (args.editMode === 'insert') {
        const cellIndex = args.cellIndex ?? notebook.cells.length;
        const newCell: NotebookCell = {
          cell_type: args.cellType ?? 'code',
          source: (args.cellSource ?? '').split('\n').map((line, i, arr) =>
            i < arr.length - 1 ? line + '\n' : line,
          ),
          metadata: {},
          ...(args.cellType === 'code' ? { outputs: [], execution_count: null } : {}),
        };
        notebook.cells.splice(cellIndex, 0, newCell);
        await writeNotebook(args.notebookPath, notebook);
        return { toolUseId: '', name: 'NotebookEditTool', result: `Inserted ${args.cellType ?? 'code'} cell at index ${cellIndex}` };
      }

      if (args.editMode === 'delete') {
        if (args.cellIndex === undefined) {
          return { toolUseId: '', name: 'NotebookEditTool', result: '', error: 'cellIndex required for delete', isError: true };
        }
        if (args.cellIndex < 0 || args.cellIndex >= notebook.cells.length) {
          return { toolUseId: '', name: 'NotebookEditTool', result: '', error: `Cell index ${args.cellIndex} out of range (0-${notebook.cells.length - 1})`, isError: true };
        }
        notebook.cells.splice(args.cellIndex, 1);
        await writeNotebook(args.notebookPath, notebook);
        return { toolUseId: '', name: 'NotebookEditTool', result: `Deleted cell at index ${args.cellIndex}` };
      }

      if (args.editMode === 'replace') {
        if (args.cellIndex === undefined) {
          return { toolUseId: '', name: 'NotebookEditTool', result: '', error: 'cellIndex required for replace', isError: true };
        }
        if (args.cellIndex < 0 || args.cellIndex >= notebook.cells.length) {
          return { toolUseId: '', name: 'NotebookEditTool', result: '', error: `Cell index ${args.cellIndex} out of range`, isError: true };
        }
        const cell = notebook.cells[args.cellIndex]!;
        if (args.cellType) cell.cell_type = args.cellType;
        if (args.cellSource !== undefined) {
          cell.source = args.cellSource.split('\n').map((line, i, arr) =>
            i < arr.length - 1 ? line + '\n' : line,
          );
        }
        await writeNotebook(args.notebookPath, notebook);
        return { toolUseId: '', name: 'NotebookEditTool', result: `Replaced cell at index ${args.cellIndex}` };
      }

      return { toolUseId: '', name: 'NotebookEditTool', result: '', error: `Unknown edit mode: ${args.editMode}`, isError: true };
    } catch (error) {
      return { toolUseId: '', name: 'NotebookEditTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
```

- [ ] **Step 3: Run tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/tools/NotebookEditTool.test.ts`

- [ ] **Step 4: Register and commit**

```bash
cd c:/Users/rap/mimo-code/mimo-code
# Add to src/tools.ts registry
git add src/tools/NotebookEditTool/ tests/unit/tools/NotebookEditTool.test.ts src/tools.ts
git commit -m "feat(tools): add NotebookEditTool for Jupyter notebook editing"
```

---

## Task 3: AskUserQuestionTool

**Files:**
- Create: `src/tools/AskUserQuestionTool/AskUserQuestionTool.ts`
- Test: `tests/unit/tools/AskUserQuestionTool.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/tools/AskUserQuestionTool.test.ts
import { describe, it, expect } from 'vitest';
import { AskUserQuestionTool } from '../../../src/tools/AskUserQuestionTool/AskUserQuestionTool.js';

describe('AskUserQuestionTool', () => {
  it('has correct name', () => {
    const tool = AskUserQuestionTool();
    expect(tool.name).toBe('AskUserQuestionTool');
  });

  it('validates input with question', () => {
    const tool = AskUserQuestionTool();
    const result = tool.inputSchema.safeParse({
      question: 'Which framework?',
      options: ['React', 'Vue', 'Angular'],
    });
    expect(result.success).toBe(true);
  });

  it('validates input with open question', () => {
    const tool = AskUserQuestionTool();
    const result = tool.inputSchema.safeParse({
      question: 'What is your API key?',
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Implement AskUserQuestionTool**

```ts
// src/tools/AskUserQuestionTool/AskUserQuestionTool.ts
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  question: z.string().min(1).describe('Question to ask the user'),
  options: z.array(z.string()).optional().describe('Multiple choice options (omit for open question)'),
  multiSelect: z.boolean().optional().default(false).describe('Allow selecting multiple options'),
  defaultAnswer: z.string().optional().describe('Default answer if user does not respond'),
});

export const AskUserQuestionTool = () => buildTool({
  name: 'AskUserQuestionTool',
  aliases: ['ask'],
  inputSchema,
  isReadOnly: () => true,
  description: async () => 'Ask the user a clarifying question.',
  prompt: () => 'Ask the user a question. Supports multiple choice and open-ended questions.',
  call: async (args, context) => {
    try {
      let promptText = `\n❓ ${args.question}\n`;

      if (args.options && args.options.length > 0) {
        args.options.forEach((opt, i) => {
          promptText += `  ${i + 1}. ${opt}\n`;
        });
        if (args.multiSelect) {
          promptText += '  (Select multiple, comma-separated numbers, or type custom answer)\n';
        } else {
          promptText += '  (Enter number or type custom answer)\n';
        }
      } else {
        promptText += '  (Type your answer)\n';
      }

      if (args.defaultAnswer) {
        promptText += `  Default: ${args.defaultAnswer}\n`;
      }

      const answer = await context.requestPrompt(promptText);

      if (!answer && args.defaultAnswer) {
        return { toolUseId: '', name: 'AskUserQuestionTool', result: args.defaultAnswer };
      }

      if (!answer) {
        return { toolUseId: '', name: 'AskUserQuestionTool', result: '(no answer provided)' };
      }

      // If options provided, try to parse as selection
      if (args.options && args.options.length > 0) {
        const numbers = answer.split(',').map(s => parseInt(s.trim()) - 1).filter(n => !isNaN(n));
        if (numbers.length > 0) {
          const selected = numbers.map(n => args.options![n]).filter(Boolean);
          if (selected.length > 0) {
            return { toolUseId: '', name: 'AskUserQuestionTool', result: selected.join(', ') };
          }
        }
      }

      return { toolUseId: '', name: 'AskUserQuestionTool', result: answer };
    } catch (error) {
      return { toolUseId: '', name: 'AskUserQuestionTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
```

- [ ] **Step 3: Run tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/tools/AskUserQuestionTool.test.ts`

- [ ] **Step 4: Register and commit**

```bash
cd c:/Users/rap/mimo-code/mimo-code
git add src/tools/AskUserQuestionTool/ tests/unit/tools/AskUserQuestionTool.test.ts src/tools.ts
git commit -m "feat(tools): add AskUserQuestionTool for user clarification"
```

---

## Task 4: PowerShellTool

**Files:**
- Create: `src/tools/PowerShellTool/PowerShellTool.ts`
- Test: `tests/unit/tools/PowerShellTool.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/tools/PowerShellTool.test.ts
import { describe, it, expect } from 'vitest';
import { PowerShellTool } from '../../../src/tools/PowerShellTool/PowerShellTool.js';

describe('PowerShellTool', () => {
  it('has correct name', () => {
    const tool = PowerShellTool();
    expect(tool.name).toBe('PowerShellTool');
  });

  it('validates input', () => {
    const tool = PowerShellTool();
    const result = tool.inputSchema.safeParse({ command: 'Get-Process' });
    expect(result.success).toBe(true);
  });

  it('is destructive', () => {
    const tool = PowerShellTool();
    expect(tool.isDestructive()).toBe(true);
  });
});
```

- [ ] **Step 2: Implement PowerShellTool**

```ts
// src/tools/PowerShellTool/PowerShellTool.ts
import { spawn } from 'node:child_process';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';
import { analyzeCommand } from '../../utils/bash/bashSecurity.js';

const inputSchema = z.object({
  command: z.string().describe('PowerShell command to execute'),
  timeout: z.number().optional().default(120000).describe('Timeout in milliseconds'),
});

function detectPowerShell(): string {
  // Prefer pwsh (7+) over powershell (5.1)
  return 'pwsh';
}

export const PowerShellTool = () => buildTool({
  name: 'PowerShellTool',
  aliases: ['ps', 'pwsh'],
  inputSchema,
  isDestructive: () => true,
  description: async () => 'Execute a PowerShell command and return stdout/stderr.',
  prompt: () => 'Run a PowerShell command (Windows). Returns stdout and stderr.',
  checkPermissions: (args) => {
    // Reuse bash security analysis
    const risk = analyzeCommand(args.command);
    if (risk === 'critical') {
      return { allowed: false, reason: 'Command blocked by security policy (critical risk)' };
    }
    return { allowed: true };
  },
  call: async (args) => {
    return new Promise((resolve) => {
      const parts: string[] = [];
      const errParts: string[] = [];
      const pwsh = detectPowerShell();

      const proc = spawn(pwsh, ['-NoProfile', '-NonInteractive', '-Command', args.command], {
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
        if (code !== 0) {
          resolve({ toolUseId: '', name: 'PowerShellTool', result: combined, error: `Exit code ${code}`, isError: true });
        } else {
          resolve({ toolUseId: '', name: 'PowerShellTool', result: combined || '(no output)' });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ toolUseId: '', name: 'PowerShellTool', result: '', error: err.message, isError: true });
      });

      proc.stdin.end();
    });
  },
});
```

- [ ] **Step 3: Run tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/tools/PowerShellTool.test.ts`

- [ ] **Step 4: Register and commit**

```bash
cd c:/Users/rap/mimo-code/mimo-code
git add src/tools/PowerShellTool/ tests/unit/tools/PowerShellTool.test.ts src/tools.ts
git commit -m "feat(tools): add PowerShellTool for Windows PowerShell execution"
```

---

## Task 5: AgentTool

**Files:**
- Create: `src/tools/AgentTool/AgentTool.ts`
- Test: `tests/unit/tools/AgentTool.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/tools/AgentTool.test.ts
import { describe, it, expect } from 'vitest';
import { AgentTool } from '../../../src/tools/AgentTool/AgentTool.js';

describe('AgentTool', () => {
  it('has correct name', () => {
    const tool = AgentTool();
    expect(tool.name).toBe('AgentTool');
  });

  it('validates input', () => {
    const tool = AgentTool();
    const result = tool.inputSchema.safeParse({
      prompt: 'Find all TypeScript files',
      agentType: 'explore',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty prompt', () => {
    const tool = AgentTool();
    const result = tool.inputSchema.safeParse({ prompt: '' });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Implement AgentTool**

```ts
// src/tools/AgentTool/AgentTool.ts
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  prompt: z.string().min(1).describe('Task description for the sub-agent'),
  agentType: z.enum(['explore', 'plan', 'verify', 'general']).optional().default('general').describe('Type of agent'),
});

export const AgentTool = () => buildTool({
  name: 'AgentTool',
  aliases: ['agent', 'subagent'],
  inputSchema,
  isReadOnly: () => false,
  isConcurrencySafe: () => false,
  description: async () => 'Spawn a sub-agent to perform an independent task and return the result.',
  prompt: () => 'Spawn a sub-agent. Agent types: explore (search codebase), plan (design approach), verify (check work), general (any task).',
  call: async (args, context) => {
    try {
      const { queryLoop } = await import('../../query.js');
      const { APIClient } = await import('../../services/api/client.js');
      const { createDefaultRegistry } = await import('../../tools.js');
      const { getSystemContext } = await import('../../context.js');
      const { getSystemPrompt } = await import('../../constants/prompts.js');

      const options = context.options;
      const apiKey = process.env.MIMO_API_KEY ?? '';
      const endpoint = process.env.MIMO_API_ENDPOINT ?? 'https://api.mimo.ai/v1';

      if (!apiKey) {
        return { toolUseId: '', name: 'AgentTool', result: '', error: 'No API key configured for sub-agent', isError: true };
      }

      const client = new APIClient(endpoint, apiKey);
      const toolRegistry = createDefaultRegistry();

      const systemPrompts: Record<string, string> = {
        explore: 'You are an exploration agent. Search the codebase thoroughly and report findings. Be concise.',
        plan: 'You are a planning agent. Analyze the task and produce a clear implementation plan.',
        verify: 'You are a verification agent. Check the work for correctness and report any issues.',
        general: 'You are a helpful coding agent. Complete the task and report results.',
      };

      const systemPrompt = systemPrompts[args.agentType] ?? systemPrompts.general;
      const fullSystemPrompt = `${systemPrompt}\n\n${getSystemPrompt([], getSystemContext())}`;

      const subMessages: Array<{ role: 'user' | 'assistant' | 'system' | 'tool'; content: string }> = [
        { role: 'user', content: args.prompt },
      ];

      const resultParts: string[] = [];

      for await (const msg of queryLoop(
        subMessages,
        {
          callModel: (req) => client.streamChat(req),
          microcompact: (m) => m,
          autocompact: async (m) => m,
          uuid: () => crypto.randomUUID(),
          getTool: (name) => toolRegistry.get(name),
          toolContext: {
            options: { model: options.model },
            abortController: new AbortController(),
            readFileState: new Map(),
            messages: [],
            toolDecisions: new Map(),
            requestPrompt: async () => '',
            getAppState: () => ({}),
            setAppState: () => {},
          },
        },
        { model: options.model, maxTokens: 4096, temperature: 0.7 },
        fullSystemPrompt,
      )) {
        if (msg.role === 'assistant' && typeof msg.content === 'string') {
          resultParts.push(msg.content);
        }
      }

      const result = resultParts.join('\n').trim();
      return {
        toolUseId: '',
        name: 'AgentTool',
        result: result || '(agent produced no output)',
      };
    } catch (error) {
      return {
        toolUseId: '',
        name: 'AgentTool',
        result: '',
        error: error instanceof Error ? error.message : String(error),
        isError: true,
      };
    }
  },
});
```

- [ ] **Step 3: Run tests**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run tests/unit/tools/AgentTool.test.ts`

- [ ] **Step 4: Register and commit**

```bash
cd c:/Users/rap/mimo-code/mimo-code
git add src/tools/AgentTool/ tests/unit/tools/AgentTool.test.ts src/tools.ts
git commit -m "feat(tools): add AgentTool for sub-agent spawning"
```

---

## Task 6: Final Integration

- [ ] **Step 1: Run full test suite**

Run: `cd c:/Users/rap/mimo-code/mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Verify tool count**

Run: `cd c:/Users/rap/mimo-code/mimo-code && grep -c "registry.register" src/tools.ts`
Expected: 13 (8 original + 5 new)

- [ ] **Step 3: Commit**

```bash
cd c:/Users/rap/mimo-code/mimo-code
git add -A
git commit -m "feat: Phase 2 complete — 13 tools total"
```
