import { describe, it, expect } from 'vitest';
import { queryLoop } from '../../src/query.js';
import type { QueryDeps } from '../../src/query.js';
import type { Message, StreamChunk } from '../../src/types/index.js';
import type { ToolUseContext } from '../../src/types/tool.js';

const mockToolContext: ToolUseContext = {
  options: { model: 'test' },
  abortController: new AbortController(),
  readFileState: new Map(),
  messages: [],
  toolDecisions: new Map(),
  requestPrompt: async () => '',
  getAppState: () => ({}),
  setAppState: () => {},
};

function makeDeps(chunks: StreamChunk[]): QueryDeps {
  return {
    callModel: async function* () {
      for (const chunk of chunks) yield chunk;
    },
    microcompact: (msgs) => msgs,
    autocompact: (msgs) => msgs,
    uuid: () => 'test-uuid',
    getTool: () => undefined,
    toolContext: mockToolContext,
  };
}

describe('queryLoop', () => {
  it('should yield assistant message from text chunks', async () => {
    const deps = makeDeps([
      { type: 'text', content: 'Hello!' },
      { type: 'done', finishReason: 'stop' },
    ]);
    const messages: Message[] = [{ role: 'user', content: 'Hi' }];
    const results: Message[] = [];
    for await (const msg of queryLoop(messages, deps, { model: 'test' })) {
      results.push(msg);
    }
    const assistantMsg = results.find(m => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg!.content).toBe('Hello!');
  });

  it('should stop on done without tool calls', async () => {
    const deps = makeDeps([
      { type: 'text', content: 'Answer' },
      { type: 'done', finishReason: 'stop' },
    ]);
    const results: Message[] = [];
    for await (const msg of queryLoop([{ role: 'user', content: 'Q' }], deps, { model: 'test' })) {
      results.push(msg);
    }
    expect(results).toHaveLength(1);
    expect(results[0].content).toBe('Answer');
  });

  it('should handle tool calls in response', async () => {
    const deps = makeDeps([
      { type: 'text', content: 'Let me check.' },
      { type: 'tool_use', toolCall: { id: 'call_1', type: 'function', function: { name: 'EchoTool', arguments: '{"text":"hi"}' } } },
      { type: 'done', finishReason: 'tool_calls' },
      { type: 'text', content: 'Done!' },
      { type: 'done', finishReason: 'stop' },
    ]);
    const results: Message[] = [];
    for await (const msg of queryLoop([{ role: 'user', content: 'Check' }], deps, { model: 'test' })) {
      results.push(msg);
    }
    expect(results.length).toBeGreaterThanOrEqual(2);
  });
});
