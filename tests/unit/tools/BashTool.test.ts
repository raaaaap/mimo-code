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
  it('should report exit code on failure', async () => {
    const tool = BashTool();
    const result = await tool.call({ command: 'exit 1' }, makeCtx());
    expect(result.isError).toBe(true);
  });
  it('should not be read-only', () => {
    const tool = BashTool();
    expect(tool.isReadOnly()).toBe(false);
    expect(tool.isDestructive()).toBe(true);
  });
});
