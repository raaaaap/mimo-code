import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileReadTool } from '../../../src/tools/FileReadTool/FileReadTool.js';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { ToolUseContext } from '../../../src/types/tool.js';

const TEST_DIR = '/tmp/mimo-test-fileread';
function makeCtx(): ToolUseContext { return { options: { model: 'test' }, abortController: new AbortController(), readFileState: new Map(), messages: [], toolDecisions: new Map(), requestPrompt: async () => '', getAppState: () => ({}), setAppState: () => {} }; }

beforeEach(async () => { await mkdir(TEST_DIR, { recursive: true }); await writeFile(join(TEST_DIR, 'test.txt'), 'Hello World\nLine 2\nLine 3', 'utf-8'); });
afterEach(async () => { await rm(TEST_DIR, { recursive: true, force: true }); });

describe('FileReadTool', () => {
  it('should read a file', async () => {
    const tool = FileReadTool();
    const result = await tool.call({ file_path: join(TEST_DIR, 'test.txt') }, makeCtx());
    expect(result.isError).toBeFalsy();
    expect(result.result).toContain('Hello World');
  });
  it('should error on non-existent file', async () => {
    const tool = FileReadTool();
    const result = await tool.call({ file_path: join(TEST_DIR, 'nope.txt') }, makeCtx());
    expect(result.isError).toBe(true);
  });
  it('should report as read-only', () => {
    const tool = FileReadTool();
    expect(tool.isReadOnly()).toBe(true);
    expect(tool.isConcurrencySafe()).toBe(true);
  });
});
