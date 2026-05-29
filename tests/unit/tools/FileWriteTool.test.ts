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
