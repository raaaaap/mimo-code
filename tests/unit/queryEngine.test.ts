import { describe, it, expect } from 'vitest';
import { QueryEngine } from '../../src/QueryEngine.js';
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

const mockToolDeps = {
  getTool: () => undefined,
  toolContext: mockToolContext,
};

describe('QueryEngine', () => {
  it('should initialize with empty messages', () => {
    const engine = new QueryEngine({
      callModel: async function* () { yield { type: 'done' }; },
      microcompact: (m) => m,
      autocompact: (m) => m,
      uuid: () => 'test',
      ...mockToolDeps,
      model: 'test',
    });
    expect(engine.getMessages()).toEqual([]);
    expect(engine.getUsage()).toEqual({ inputTokens: 0, outputTokens: 0 });
  });

  it('should submit message and get response', async () => {
    const engine = new QueryEngine({
      callModel: async function* () {
        yield { type: 'text', content: 'Hi there!' };
        yield { type: 'done', finishReason: 'stop', usage: { inputTokens: 5, outputTokens: 3 } };
      },
      microcompact: (m) => m,
      autocompact: (m) => m,
      uuid: () => 'test',
      ...mockToolDeps,
      model: 'test',
    });

    const results: any[] = [];
    for await (const msg of engine.submitMessage('Hello')) {
      results.push(msg);
    }
    expect(engine.getMessages()).toHaveLength(2); // user + assistant
    expect(results.some(m => m.content === 'Hi there!')).toBe(true);
  });
});
