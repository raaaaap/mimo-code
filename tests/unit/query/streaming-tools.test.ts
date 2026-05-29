import { describe, it, expect, vi } from 'vitest';
import { StreamingToolExecutor } from '../../../src/services/tools/StreamingToolExecutor.js';
import type { Tool } from '../../../src/types/tool.js';

function createMockTool(overrides: Partial<Tool> = {}): Tool {
  return {
    name: 'TestTool',
    inputSchema: { safeParse: (v: any) => ({ success: true, data: v }) } as any,
    call: vi.fn().mockResolvedValue({ toolUseId: 'tc1', name: 'TestTool', result: 'tool result' }),
    checkPermissions: () => ({ allowed: true }),
    isConcurrencySafe: () => false,
    isReadOnly: () => false,
    isDestructive: () => false,
    interruptBehavior: () => 'cancel' as const,
    description: async () => 'test',
    prompt: () => 'test',
    ...overrides,
  } as Tool;
}

describe('StreamingToolExecutor', () => {
  it('executes tool call and returns result via callback', async () => {
    const mockTool = createMockTool();
    const executor = new StreamingToolExecutor(() => mockTool, {
      options: { model: 'test' },
      abortController: new AbortController(),
      readFileState: new Map(),
      messages: [],
      toolDecisions: new Map(),
      requestPrompt: async () => '',
      getAppState: () => ({}),
      setAppState: () => {},
    });

    const results: any[] = [];
    executor.onResult((r) => results.push(r));

    executor.addToolCall({
      id: 'tc1',
      type: 'function',
      function: { name: 'TestTool', arguments: '{}' },
    });

    // Wait for async execution
    await new Promise((r) => setTimeout(r, 50));

    expect(results).toHaveLength(1);
    expect(results[0].result).toBe('tool result');
  });

  it('returns Promise from addToolCall', async () => {
    const mockTool = createMockTool();
    const executor = new StreamingToolExecutor(() => mockTool, {
      options: { model: 'test' },
      abortController: new AbortController(),
      readFileState: new Map(),
      messages: [],
      toolDecisions: new Map(),
      requestPrompt: async () => '',
      getAppState: () => ({}),
      setAppState: () => {},
    });

    const promise = executor.addToolCall({
      id: 'tc2',
      type: 'function',
      function: { name: 'TestTool', arguments: '{}' },
    });

    const result = await promise;
    expect(result.result).toBe('tool result');
  });

  it('handles unknown tool', async () => {
    const executor = new StreamingToolExecutor(() => undefined, {
      options: { model: 'test' },
      abortController: new AbortController(),
      readFileState: new Map(),
      messages: [],
      toolDecisions: new Map(),
      requestPrompt: async () => '',
      getAppState: () => ({}),
      setAppState: () => {},
    });

    const result = await executor.addToolCall({
      id: 'tc3',
      type: 'function',
      function: { name: 'UnknownTool', arguments: '{}' },
    });

    expect(result.isError).toBe(true);
    expect(result.error).toContain('Unknown tool');
  });
});
