# Mimo Coding Agent - Phase 3: Essential Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement the essential built-in tools: BashTool, FileReadTool, FileEditTool, FileWriteTool, GrepTool, GlobTool, WebFetchTool, TodoWriteTool.

**Architecture:** Each tool implements the `Tool` interface from `src/types/tool.ts`, uses `buildTool()` for defaults, and lives in its own directory under `src/tools/`.

**Prerequisites:** Phase 2 complete (ToolRegistry, Tool Execution Engine, QueryEngine)

---

### Task 1: FileReadTool

**Files:**
- Create: `mimo-code/src/tools/FileReadTool/FileReadTool.ts`
- Test: `mimo-code/tests/unit/tools/FileReadTool.test.ts`

- [ ] **Step 1: Write test**

```typescript
// tests/unit/tools/FileReadTool.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileReadTool } from '../../../src/tools/FileReadTool/FileReadTool.js';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { ToolUseContext } from '../../../src/types/tool.js';

const TEST_DIR = '/tmp/mimo-test-fileread';

function makeCtx(): ToolUseContext {
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

beforeEach(async () => {
  await mkdir(TEST_DIR, { recursive: true });
  await writeFile(join(TEST_DIR, 'test.txt'), 'Hello World\nLine 2\nLine 3', 'utf-8');
});

afterEach(async () => {
  await rm(TEST_DIR, { recursive: true, force: true });
});

describe('FileReadTool', () => {
  it('should read a file', async () => {
    const tool = new FileReadTool();
    const result = await tool.call({ file_path: join(TEST_DIR, 'test.txt') }, makeCtx());
    expect(result.isError).toBeFalsy();
    expect(result.result).toContain('Hello World');
  });

  it('should read a file with offset and limit', async () => {
    const tool = new FileReadTool();
    const result = await tool.call({ file_path: join(TEST_DIR, 'test.txt'), offset: 1, limit: 1 }, makeCtx());
    expect(result.isError).toBeFalsy();
    expect(result.result).toContain('Line 2');
  });

  it('should error on non-existent file', async () => {
    const tool = new FileReadTool();
    const result = await tool.call({ file_path: join(TEST_DIR, 'nope.txt') }, makeCtx());
    expect(result.isError).toBe(true);
  });

  it('should report as read-only', () => {
    const tool = new FileReadTool();
    expect(tool.isReadOnly()).toBe(true);
    expect(tool.isConcurrencySafe()).toBe(true);
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// src/tools/FileReadTool/FileReadTool.ts
import { readFile, stat } from 'node:fs/promises';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  file_path: z.string().describe('Absolute path to the file'),
  offset: z.number().optional().describe('Line number to start reading from (0-based)'),
  limit: z.number().optional().describe('Maximum number of lines to read'),
});

export const FileReadTool = () => buildTool({
  name: 'FileReadTool',
  inputSchema,
  isReadOnly: () => true,
  isConcurrencySafe: () => true,
  description: async () => 'Read the contents of a file. Supports reading with line offset and limit.',
  prompt: () => 'Read a file from disk. Use file_path for the absolute path, optional offset (0-based line number) and limit (max lines).',
  call: async (args) => {
    try {
      const content = await readFile(args.file_path, 'utf-8');
      const lines = content.split('\n');
      const offset = args.offset ?? 0;
      const limit = args.limit ?? lines.length;
      const selected = lines.slice(offset, offset + limit);
      const numbered = selected.map((line, i) => `${offset + i + 1}\t${line}`).join('\n');
      return { toolUseId: '', name: 'FileReadTool', result: numbered };
    } catch (error) {
      return { toolUseId: '', name: 'FileReadTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
```

- [ ] **Step 3: Run test, commit**

```bash
git add mimo-code/src/tools/FileReadTool/ mimo-code/tests/unit/tools/FileReadTool.test.ts
git commit -m "feat: FileReadTool with offset/limit support"
```

---

### Task 2: FileWriteTool

**Files:**
- Create: `mimo-code/src/tools/FileWriteTool/FileWriteTool.ts`
- Test: `mimo-code/tests/unit/tools/FileWriteTool.test.ts`

- [ ] **Step 1: Write test**

```typescript
// tests/unit/tools/FileWriteTool.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileWriteTool } from '../../../src/tools/FileWriteTool/FileWriteTool.js';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { ToolUseContext } from '../../../src/types/tool.js';

const TEST_DIR = '/tmp/mimo-test-filewrite';
function makeCtx(): ToolUseContext { return { options: { model: 'test' }, abortController: new AbortController(), readFileState: new Map(), messages: [], toolDecisions: new Map(), requestPrompt: async () => '', getAppState: () => ({}), setAppState: () => {} }; }

beforeEach(async () => { await mkdir(TEST_DIR, { recursive: true }); });
afterEach(async () => { await rm(TEST_DIR, { recursive: true, force: true }); });

describe('FileWriteTool', () => {
  it('should write a file', async () => {
    const tool = FileWriteTool();
    const path = join(TEST_DIR, 'new.txt');
    const result = await tool.call({ file_path: path, content: 'Hello' }, makeCtx());
    expect(result.isError).toBeFalsy();
    expect(await readFile(path, 'utf-8')).toBe('Hello');
  });

  it('should create parent directories', async () => {
    const tool = FileWriteTool();
    const path = join(TEST_DIR, 'sub', 'dir', 'file.txt');
    await tool.call({ file_path: path, content: 'nested' }, makeCtx());
    expect(await readFile(path, 'utf-8')).toBe('nested');
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// src/tools/FileWriteTool/FileWriteTool.ts
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  file_path: z.string().describe('Absolute path to the file'),
  content: z.string().describe('Content to write'),
});

export const FileWriteTool = () => buildTool({
  name: 'FileWriteTool',
  inputSchema,
  isDestructive: () => true,
  description: async () => 'Write content to a file. Creates parent directories if needed.',
  prompt: () => 'Write content to a file at file_path. Overwrites existing content.',
  call: async (args) => {
    try {
      await mkdir(dirname(args.file_path), { recursive: true });
      await writeFile(args.file_path, args.content, 'utf-8');
      return { toolUseId: '', name: 'FileWriteTool', result: `File written: ${args.file_path}` };
    } catch (error) {
      return { toolUseId: '', name: 'FileWriteTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
```

- [ ] **Step 3: Run test, commit**

---

### Task 3: FileEditTool

**Files:**
- Create: `mimo-code/src/tools/FileEditTool/FileEditTool.ts`
- Test: `mimo-code/tests/unit/tools/FileEditTool.test.ts`

- [ ] **Step 1: Write test**

```typescript
// tests/unit/tools/FileEditTool.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileEditTool } from '../../../src/tools/FileEditTool/FileEditTool.js';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { ToolUseContext } from '../../../src/types/tool.js';

const TEST_DIR = '/tmp/mimo-test-fileedit';
function makeCtx(): ToolUseContext { return { options: { model: 'test' }, abortController: new AbortController(), readFileState: new Map(), messages: [], toolDecisions: new Map(), requestPrompt: async () => '', getAppState: () => ({}), setAppState: () => {} }; }

beforeEach(async () => { await mkdir(TEST_DIR, { recursive: true }); });
afterEach(async () => { await rm(TEST_DIR, { recursive: true, force: true }); });

describe('FileEditTool', () => {
  it('should replace exact string', async () => {
    const path = join(TEST_DIR, 'edit.txt');
    await writeFile(path, 'Hello World', 'utf-8');
    const tool = FileEditTool();
    const result = await tool.call({ file_path: path, old_string: 'World', new_string: 'Mimo' }, makeCtx());
    expect(result.isError).toBeFalsy();
    expect(await readFile(path, 'utf-8')).toBe('Hello Mimo');
  });

  it('should error if old_string not found', async () => {
    const path = join(TEST_DIR, 'edit.txt');
    await writeFile(path, 'Hello World', 'utf-8');
    const tool = FileEditTool();
    const result = await tool.call({ file_path: path, old_string: 'NotFound', new_string: 'X' }, makeCtx());
    expect(result.isError).toBe(true);
  });

  it('should error if old_string is not unique and replace_all is false', async () => {
    const path = join(TEST_DIR, 'edit.txt');
    await writeFile(path, 'aaa bbb aaa', 'utf-8');
    const tool = FileEditTool();
    const result = await tool.call({ file_path: path, old_string: 'aaa', new_string: 'ccc', replace_all: false }, makeCtx());
    expect(result.isError).toBe(true);
  });

  it('should replace all occurrences when replace_all is true', async () => {
    const path = join(TEST_DIR, 'edit.txt');
    await writeFile(path, 'aaa bbb aaa', 'utf-8');
    const tool = FileEditTool();
    const result = await tool.call({ file_path: path, old_string: 'aaa', new_string: 'ccc', replace_all: true }, makeCtx());
    expect(result.isError).toBeFalsy();
    expect(await readFile(path, 'utf-8')).toBe('ccc bbb ccc');
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// src/tools/FileEditTool/FileEditTool.ts
import { readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  file_path: z.string().describe('Absolute path to the file'),
  old_string: z.string().describe('Exact string to replace'),
  new_string: z.string().describe('Replacement string'),
  replace_all: z.boolean().optional().default(false).describe('Replace all occurrences'),
});

export const FileEditTool = () => buildTool({
  name: 'FileEditTool',
  inputSchema,
  description: async () => 'Replace an exact string in a file. By default replaces only the first occurrence.',
  prompt: () => 'Edit a file by replacing old_string with new_string. The old_string must be unique unless replace_all is true.',
  call: async (args) => {
    try {
      const content = await readFile(args.file_path, 'utf-8');
      const count = content.split(args.old_string).length - 1;
      if (count === 0) {
        return { toolUseId: '', name: 'FileEditTool', result: '', error: `old_string not found in ${args.file_path}`, isError: true };
      }
      if (!args.replace_all && count > 1) {
        return { toolUseId: '', name: 'FileEditTool', result: '', error: `old_string found ${count} times. Use replace_all=true or provide a more specific string.`, isError: true };
      }
      const newContent = args.replace_all
        ? content.replaceAll(args.old_string, args.new_string)
        : content.replace(args.old_string, args.new_string);
      await writeFile(args.file_path, newContent, 'utf-8');
      return { toolUseId: '', name: 'FileEditTool', result: `Edited ${args.file_path} (${count} replacement${count > 1 ? 's' : ''})` };
    } catch (error) {
      return { toolUseId: '', name: 'FileEditTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
```

- [ ] **Step 3: Run test, commit**

---

### Task 4: GlobTool

**Files:**
- Create: `mimo-code/src/tools/GlobTool/GlobTool.ts`
- Test: `mimo-code/tests/unit/tools/GlobTool.test.ts`

- [ ] **Step 1: Write test + implement**

```typescript
// src/tools/GlobTool/GlobTool.ts
import { glob } from 'glob';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  pattern: z.string().describe('Glob pattern (e.g. "**/*.ts")'),
  path: z.string().optional().describe('Directory to search in (defaults to cwd)'),
});

export const GlobTool = () => buildTool({
  name: 'GlobTool',
  inputSchema,
  isReadOnly: () => true,
  isConcurrencySafe: () => true,
  description: async () => 'Find files matching a glob pattern.',
  prompt: () => 'Search for files by glob pattern. Returns matching file paths sorted by modification time.',
  call: async (args) => {
    try {
      const files = await glob(args.pattern, { cwd: args.path ?? process.cwd(), nodir: true });
      return { toolUseId: '', name: 'GlobTool', result: files.slice(0, 200).join('\n') || 'No files found' };
    } catch (error) {
      return { toolUseId: '', name: 'GlobTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
```

- [ ] **Step 2: Run test, commit**

---

### Task 5: GrepTool (via ripgrep or fallback)

**Files:**
- Create: `mimo-code/src/tools/GrepTool/GrepTool.ts`
- Test: `mimo-code/tests/unit/tools/GrepTool.test.ts`

- [ ] **Step 1: Implement**

```typescript
// src/tools/GrepTool/GrepTool.ts
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const execFileAsync = promisify(execFile);

const inputSchema = z.object({
  pattern: z.string().describe('Regex pattern to search for'),
  path: z.string().optional().describe('File or directory to search in'),
  glob: z.string().optional().describe('Glob pattern to filter files (e.g. "*.ts")'),
});

export const GrepTool = () => buildTool({
  name: 'GrepTool',
  inputSchema,
  isReadOnly: () => true,
  isConcurrencySafe: () => true,
  description: async () => 'Search file contents using ripgrep. Returns matching lines with file paths and line numbers.',
  prompt: () => 'Search for text patterns in files. Uses ripgrep for fast searching. Supports regex.',
  call: async (args) => {
    try {
      const rgArgs = ['--no-heading', '-n'];
      if (args.glob) rgArgs.push('--glob', args.glob);
      rgArgs.push(args.pattern);
      if (args.path) rgArgs.push(args.path);

      const { stdout } = await execFileAsync('rg', rgArgs, { timeout: 30000, maxBuffer: 1024 * 1024 });
      return { toolUseId: '', name: 'GrepTool', result: stdout.trim() || 'No matches found' };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return { toolUseId: '', name: 'GrepTool', result: '', error: 'ripgrep (rg) not found. Install it: https://github.com/BurntSushi/ripgrep', isError: true };
      }
      if (error.status === 1) {
        return { toolUseId: '', name: 'GrepTool', result: 'No matches found' };
      }
      return { toolUseId: '', name: 'GrepTool', result: '', error: error.message, isError: true };
    }
  },
});
```

- [ ] **Step 2: Run test, commit**

---

### Task 6: BashTool

**Files:**
- Create: `mimo-code/src/tools/BashTool/BashTool.ts`
- Test: `mimo-code/tests/unit/tools/BashTool.test.ts`

- [ ] **Step 1: Write test**

```typescript
// tests/unit/tools/BashTool.test.ts
import { describe, it, expect } from 'vitest';
import { BashTool } from '../../../src/tools/BashTool/BashTool.js';
import type { ToolUseContext } from '../../../src/types/tool.js';

function makeCtx(): ToolUseContext { return { options: { model: 'test' }, abortController: new AbortController(), readFileState: new Map(), messages: [], toolDecisions: new Map(), requestPrompt: async () => '', getAppState: () => ({}), setAppState: () => {} }; }

describe('BashTool', () => {
  it('should execute a simple command', async () => {
    const tool = BashTool();
    const result = await tool.call({ command: 'echo hello' }, makeCtx());
    expect(result.isError).toBeFalsy();
    expect(result.result).toContain('hello');
  });

  it('should capture stderr', async () => {
    const tool = BashTool();
    const result = await tool.call({ command: 'echo err >&2' }, makeCtx());
    expect(result.result).toContain('err');
  });

  it('should report exit code on failure', async () => {
    const tool = BashTool();
    const result = await tool.call({ command: 'exit 1' }, makeCtx());
    expect(result.isError).toBe(true);
  });

  it('should not be read-only or concurrency-safe', () => {
    const tool = BashTool();
    expect(tool.isReadOnly()).toBe(false);
    expect(tool.isConcurrencySafe()).toBe(false);
    expect(tool.isDestructive()).toBe(true);
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// src/tools/BashTool/BashTool.ts
import { spawn } from 'node:child_process';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  command: z.string().describe('Shell command to execute'),
  timeout: z.number().optional().default(120000).describe('Timeout in milliseconds'),
});

export const BashTool = () => buildTool({
  name: 'BashTool',
  aliases: ['bash', 'sh'],
  inputSchema,
  isDestructive: () => true,
  description: async () => 'Execute a shell command and return stdout/stderr.',
  prompt: () => 'Run a shell command. Returns stdout and stderr. Use for file operations, git, build commands, etc.',
  call: async (args, context) => {
    return new Promise((resolve) => {
      const parts: string[] = [];
      const errParts: string[] = [];
      let exitCode: number | null = null;

      const proc = spawn('bash', ['-c', args.command], {
        cwd: process.cwd(),
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const timeout = setTimeout(() => {
        proc.kill('SIGTERM');
      }, args.timeout ?? 120000);

      proc.stdout.on('data', (data: Buffer) => parts.push(data.toString()));
      proc.stderr.on('data', (data: Buffer) => errParts.push(data.toString()));

      proc.on('close', (code) => {
        clearTimeout(timeout);
        exitCode = code;
        const output = parts.join('');
        const errOutput = errParts.join('');
        const combined = [output, errOutput].filter(Boolean).join('');

        if (exitCode !== 0) {
          resolve({
            toolUseId: '', name: 'BashTool', result: combined,
            error: `Command exited with code ${exitCode}`, isError: true,
          });
        } else {
          resolve({ toolUseId: '', name: 'BashTool', result: combined || '(no output)' });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ toolUseId: '', name: 'BashTool', result: '', error: err.message, isError: true });
      });

      // Close stdin
      proc.stdin.end();
    });
  },
});
```

- [ ] **Step 3: Run test, commit**

---

### Task 7: WebFetchTool & TodoWriteTool

**Files:**
- Create: `mimo-code/src/tools/WebFetchTool/WebFetchTool.ts`
- Create: `mimo-code/src/tools/TodoWriteTool/TodoWriteTool.ts`

- [ ] **Step 1: Implement WebFetchTool**

```typescript
// src/tools/WebFetchTool/WebFetchTool.ts
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  url: z.string().url().describe('URL to fetch'),
  prompt: z.string().optional().describe('What to extract from the page'),
});

export const WebFetchTool = () => buildTool({
  name: 'WebFetchTool',
  inputSchema,
  isReadOnly: () => true,
  isConcurrencySafe: () => true,
  description: async () => 'Fetch a web page and return its content.',
  prompt: () => 'Fetch a URL and return the response body. Use for reading documentation, APIs, etc.',
  call: async (args) => {
    try {
      const response = await fetch(args.url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) {
        return { toolUseId: '', name: 'WebFetchTool', result: '', error: `HTTP ${response.status}`, isError: true };
      }
      const text = await response.text();
      const truncated = text.slice(0, 50000);
      return { toolUseId: '', name: 'WebFetchTool', result: truncated };
    } catch (error) {
      return { toolUseId: '', name: 'WebFetchTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
```

- [ ] **Step 2: Implement TodoWriteTool**

```typescript
// src/tools/TodoWriteTool/TodoWriteTool.ts
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const todoSchema = z.object({
  content: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  activeForm: z.string(),
});

const inputSchema = z.object({
  todos: z.array(todoSchema).describe('Updated todo list'),
});

export const TodoWriteTool = () => buildTool({
  name: 'TodoWriteTool',
  inputSchema,
  description: async () => 'Create and manage a task list for tracking progress.',
  prompt: () => 'Update the task list. Pass the full updated list of todos.',
  call: async (args) => {
    const summary = args.todos.map(t => `[${t.status === 'completed' ? 'x' : t.status === 'in_progress' ? '>' : ' '}] ${t.content}`).join('\n');
    return { toolUseId: '', name: 'TodoWriteTool', result: `Updated todo list:\n${summary}` };
  },
});
```

- [ ] **Step 3: Commit all tools**

```bash
git add mimo-code/src/tools/
git commit -m "feat: essential tools (Bash, FileRead, FileEdit, FileWrite, Grep, Glob, WebFetch, TodoWrite)"
```

---

### Task 8: Register All Tools & Final Verification

**Files:**
- Modify: `mimo-code/src/tools.ts` (add imports)

- [ ] **Step 1: Update tool registry to include all tools**

Add imports and register all tools in the ToolRegistry.

- [ ] **Step 2: Run all tests**

Run: `cd mimo-code && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add mimo-code/src/tools.ts
git commit -m "feat: register all essential tools in ToolRegistry"
```
