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
  it('should replace all when replace_all is true', async () => {
    const path = join(TEST_DIR, 'edit.txt');
    await writeFile(path, 'aaa bbb aaa', 'utf-8');
    const tool = FileEditTool();
    const result = await tool.call({ file_path: path, old_string: 'aaa', new_string: 'ccc', replace_all: true }, makeCtx());
    expect(result.isError).toBeFalsy();
    expect(await readFile(path, 'utf-8')).toBe('ccc bbb ccc');
  });
});
