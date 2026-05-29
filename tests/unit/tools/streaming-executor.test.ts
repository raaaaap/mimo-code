import { describe, it, expect } from 'vitest';
import { StreamingToolExecutor } from '../../../src/services/tools/StreamingToolExecutor.js';
import { buildTool } from '../../../src/types/tool.js';
import type { Tool, ToolUseContext } from '../../../src/types/tool.js';
import { z } from 'zod';

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

describe('StreamingToolExecutor', () => {
  it('should execute tool and emit result', async () => {
    const tool: Tool = buildTool({
      name: 'EchoTool',
      inputSchema: z.object({ text: z.string() }),
      call: async (args) => ({ toolUseId: '1', name: 'EchoTool', result: args.text }),
    });

    const executor = new StreamingToolExecutor(
      (name) => name === 'EchoTool' ? tool : undefined,
      makeCtx(),
    );

    const results: any[] = [];
    executor.onResult((r) => results.push(r));

    executor.addToolCall({ id: 'call_1', type: 'function', function: { name: 'EchoTool', arguments: '{"text":"hi"}' } });

    await new Promise(r => setTimeout(r, 50));

    expect(results).toHaveLength(1);
    expect(results[0].result).toBe('hi');
    expect(results[0].toolUseId).toBe('call_1');
  });

  it('should handle unknown tool', async () => {
    const executor = new StreamingToolExecutor(() => undefined, makeCtx());
    const results: any[] = [];
    executor.onResult((r) => results.push(r));

    executor.addToolCall({ id: 'call_2', type: 'function', function: { name: 'Unknown', arguments: '{}' } });

    await new Promise(r => setTimeout(r, 50));
    expect(results).toHaveLength(1);
    expect(results[0].isError).toBe(true);
  });
});
