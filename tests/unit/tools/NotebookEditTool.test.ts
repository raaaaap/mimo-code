import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotebookEditTool } from '../../../src/tools/NotebookEditTool/NotebookEditTool.js';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { ToolUseContext } from '../../../src/types/tool.js';

const TEST_DIR = '/tmp/mimo-test-notebook';

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

function makeNotebook(cells: Array<{ cell_type: string; source: string }>) {
  return {
    cells: cells.map(c => ({
      cell_type: c.cell_type,
      source: c.source.split('\n').map((line, i, arr) => i < arr.length - 1 ? line + '\n' : line),
      metadata: {},
      ...(c.cell_type === 'code' ? { outputs: [], execution_count: null } : {}),
    })),
    metadata: { kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' } },
    nbformat: 4,
    nbformat_minor: 5,
  };
}

beforeEach(async () => { await mkdir(TEST_DIR, { recursive: true }); });
afterEach(async () => { await rm(TEST_DIR, { recursive: true, force: true }); });

describe('NotebookEditTool', () => {
  it('has correct name and aliases', () => {
    const tool = NotebookEditTool();
    expect(tool.name).toBe('NotebookEditTool');
    expect(tool.aliases).toEqual(['notebook', 'ipynb']);
  });

  it('is destructive', () => {
    const tool = NotebookEditTool();
    expect(tool.isDestructive()).toBe(true);
  });

  it('validates input schema', () => {
    const tool = NotebookEditTool();
    const result = tool.inputSchema.safeParse({
      notebookPath: 'test.ipynb',
      editMode: 'insert',
      cellType: 'code',
      cellSource: 'print("hello")',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const tool = NotebookEditTool();
    const result = tool.inputSchema.safeParse({ notebookPath: 'test.ipynb' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid editMode', () => {
    const tool = NotebookEditTool();
    const result = tool.inputSchema.safeParse({
      notebookPath: 'test.ipynb',
      editMode: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  describe('insert mode', () => {
    it('inserts a code cell at the end', async () => {
      const nbPath = join(TEST_DIR, 'test.ipynb');
      const nb = makeNotebook([{ cell_type: 'code', source: 'x = 1' }]);
      await writeFile(nbPath, JSON.stringify(nb), 'utf-8');

      const tool = NotebookEditTool();
      const result = await tool.call({
        notebookPath: nbPath,
        editMode: 'insert',
        cellSource: 'y = 2',
      }, makeCtx());

      expect(result.isError).toBeFalsy();
      expect(result.result).toContain('Inserted code cell at index 1');

      const saved = JSON.parse(await readFile(nbPath, 'utf-8'));
      expect(saved.cells).toHaveLength(2);
      expect(saved.cells[1].source).toEqual(['y = 2']);
      expect(saved.cells[1].cell_type).toBe('code');
    });

    it('inserts a markdown cell at a specific index', async () => {
      const nbPath = join(TEST_DIR, 'test.ipynb');
      const nb = makeNotebook([
        { cell_type: 'code', source: 'x = 1' },
        { cell_type: 'code', source: 'y = 2' },
      ]);
      await writeFile(nbPath, JSON.stringify(nb), 'utf-8');

      const tool = NotebookEditTool();
      const result = await tool.call({
        notebookPath: nbPath,
        editMode: 'insert',
        cellIndex: 1,
        cellType: 'markdown',
        cellSource: '# Title',
      }, makeCtx());

      expect(result.isError).toBeFalsy();
      expect(result.result).toContain('Inserted markdown cell at index 1');

      const saved = JSON.parse(await readFile(nbPath, 'utf-8'));
      expect(saved.cells).toHaveLength(3);
      expect(saved.cells[1].cell_type).toBe('markdown');
      expect(saved.cells[1].source).toEqual(['# Title']);
    });

    it('returns error for out-of-range index', async () => {
      const nbPath = join(TEST_DIR, 'test.ipynb');
      const nb = makeNotebook([{ cell_type: 'code', source: 'x = 1' }]);
      await writeFile(nbPath, JSON.stringify(nb), 'utf-8');

      const tool = NotebookEditTool();
      const result = await tool.call({
        notebookPath: nbPath,
        editMode: 'insert',
        cellIndex: 5,
        cellSource: 'z = 3',
      }, makeCtx());

      expect(result.isError).toBe(true);
      expect(result.error).toContain('out of range');
    });
  });

  describe('delete mode', () => {
    it('deletes a cell', async () => {
      const nbPath = join(TEST_DIR, 'test.ipynb');
      const nb = makeNotebook([
        { cell_type: 'code', source: 'x = 1' },
        { cell_type: 'code', source: 'y = 2' },
        { cell_type: 'code', source: 'z = 3' },
      ]);
      await writeFile(nbPath, JSON.stringify(nb), 'utf-8');

      const tool = NotebookEditTool();
      const result = await tool.call({
        notebookPath: nbPath,
        editMode: 'delete',
        cellIndex: 1,
      }, makeCtx());

      expect(result.isError).toBeFalsy();
      expect(result.result).toContain('Deleted cell at index 1');

      const saved = JSON.parse(await readFile(nbPath, 'utf-8'));
      expect(saved.cells).toHaveLength(2);
      expect(saved.cells[0].source).toEqual(['x = 1']);
      expect(saved.cells[1].source).toEqual(['z = 3']);
    });

    it('errors when cellIndex is missing', async () => {
      const nbPath = join(TEST_DIR, 'test.ipynb');
      const nb = makeNotebook([{ cell_type: 'code', source: 'x = 1' }]);
      await writeFile(nbPath, JSON.stringify(nb), 'utf-8');

      const tool = NotebookEditTool();
      const result = await tool.call({
        notebookPath: nbPath,
        editMode: 'delete',
      }, makeCtx());

      expect(result.isError).toBe(true);
      expect(result.error).toContain('cellIndex required');
    });

    it('errors for out-of-range index', async () => {
      const nbPath = join(TEST_DIR, 'test.ipynb');
      const nb = makeNotebook([{ cell_type: 'code', source: 'x = 1' }]);
      await writeFile(nbPath, JSON.stringify(nb), 'utf-8');

      const tool = NotebookEditTool();
      const result = await tool.call({
        notebookPath: nbPath,
        editMode: 'delete',
        cellIndex: 5,
      }, makeCtx());

      expect(result.isError).toBe(true);
      expect(result.error).toContain('out of range');
    });
  });

  describe('replace mode', () => {
    it('replaces cell source', async () => {
      const nbPath = join(TEST_DIR, 'test.ipynb');
      const nb = makeNotebook([
        { cell_type: 'code', source: 'x = 1' },
        { cell_type: 'code', source: 'y = 2' },
      ]);
      await writeFile(nbPath, JSON.stringify(nb), 'utf-8');

      const tool = NotebookEditTool();
      const result = await tool.call({
        notebookPath: nbPath,
        editMode: 'replace',
        cellIndex: 0,
        cellSource: 'x = 100',
      }, makeCtx());

      expect(result.isError).toBeFalsy();
      expect(result.result).toContain('Replaced cell at index 0');

      const saved = JSON.parse(await readFile(nbPath, 'utf-8'));
      expect(saved.cells[0].source).toEqual(['x = 100']);
    });

    it('replaces cell type', async () => {
      const nbPath = join(TEST_DIR, 'test.ipynb');
      const nb = makeNotebook([{ cell_type: 'code', source: 'x = 1' }]);
      await writeFile(nbPath, JSON.stringify(nb), 'utf-8');

      const tool = NotebookEditTool();
      const result = await tool.call({
        notebookPath: nbPath,
        editMode: 'replace',
        cellIndex: 0,
        cellType: 'markdown',
      }, makeCtx());

      expect(result.isError).toBeFalsy();

      const saved = JSON.parse(await readFile(nbPath, 'utf-8'));
      expect(saved.cells[0].cell_type).toBe('markdown');
      // source should remain unchanged
      expect(saved.cells[0].source).toEqual(['x = 1']);
    });

    it('errors when cellIndex is missing', async () => {
      const nbPath = join(TEST_DIR, 'test.ipynb');
      const nb = makeNotebook([{ cell_type: 'code', source: 'x = 1' }]);
      await writeFile(nbPath, JSON.stringify(nb), 'utf-8');

      const tool = NotebookEditTool();
      const result = await tool.call({
        notebookPath: nbPath,
        editMode: 'replace',
        cellSource: 'z = 99',
      }, makeCtx());

      expect(result.isError).toBe(true);
      expect(result.error).toContain('cellIndex required');
    });
  });

  describe('error handling', () => {
    it('returns error for non-existent file', async () => {
      const tool = NotebookEditTool();
      const result = await tool.call({
        notebookPath: join(TEST_DIR, 'nonexistent.ipynb'),
        editMode: 'insert',
        cellSource: 'x = 1',
      }, makeCtx());

      expect(result.isError).toBe(true);
    });

    it('returns error for invalid JSON', async () => {
      const nbPath = join(TEST_DIR, 'bad.json');
      await writeFile(nbPath, 'not json at all', 'utf-8');

      const tool = NotebookEditTool();
      const result = await tool.call({
        notebookPath: nbPath,
        editMode: 'insert',
        cellSource: 'x = 1',
      }, makeCtx());

      expect(result.isError).toBe(true);
    });

    it('returns error for valid JSON but invalid notebook', async () => {
      const nbPath = join(TEST_DIR, 'notnb.json');
      await writeFile(nbPath, JSON.stringify({ foo: 'bar' }), 'utf-8');

      const tool = NotebookEditTool();
      const result = await tool.call({
        notebookPath: nbPath,
        editMode: 'insert',
        cellSource: 'x = 1',
      }, makeCtx());

      expect(result.isError).toBe(true);
      expect(result.error).toContain('Invalid notebook format');
    });
  });

  describe('multiline source', () => {
    it('splits multiline source into lines array', async () => {
      const nbPath = join(TEST_DIR, 'test.ipynb');
      const nb = makeNotebook([]);
      await writeFile(nbPath, JSON.stringify(nb), 'utf-8');

      const tool = NotebookEditTool();
      await tool.call({
        notebookPath: nbPath,
        editMode: 'insert',
        cellSource: 'line1\nline2\nline3',
      }, makeCtx());

      const saved = JSON.parse(await readFile(nbPath, 'utf-8'));
      expect(saved.cells[0].source).toEqual(['line1\n', 'line2\n', 'line3']);
    });
  });
});
