import { describe, it, expect } from 'vitest';
import { runToolUse } from '../../../src/services/tools/toolExecution.js';
import { buildTool } from '../../../src/types/tool.js';
import type { ToolUseContext } from '../../../src/types/tool.js';
import { z } from 'zod';

function makeContext(): ToolUseContext {
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

describe('runToolUse', () => {
  it('should execute a tool and return result', async () => {
    const tool = buildTool({
      name: 'EchoTool',
      inputSchema: z.object({ text: z.string() }),
      call: async (args) => ({ toolUseId: '1', name: 'EchoTool', result: args.text }),
    });
    const result = await runToolUse(tool, { text: 'hello' }, makeContext());
    expect(result.result).toBe('hello');
    expect(result.name).toBe('EchoTool');
  });

  it('should handle tool execution errors', async () => {
    const tool = buildTool({
      name: 'FailTool',
      inputSchema: z.object({}),
      call: async () => { throw new Error('boom'); },
    });
    const result = await runToolUse(tool, {}, makeContext());
    expect(result.isError).toBe(true);
    expect(result.error).toContain('boom');
  });

  it('should validate input with zod schema', async () => {
    const tool = buildTool({
      name: 'StrictTool',
      inputSchema: z.object({ count: z.number() }),
      call: async (args) => ({ toolUseId: '1', name: 'StrictTool', result: String(args.count) }),
    });
    const result = await runToolUse(tool, { count: 'not-a-number' }, makeContext());
    expect(result.isError).toBe(true);
    expect(result.error).toContain('Expected number');
  });
});
