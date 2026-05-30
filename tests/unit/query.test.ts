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

  it('should parse formatted (multi-line) JSON tool calls from text', async () => {
    const formattedJson = JSON.stringify(
      { name: 'ReadFile', arguments: { path: '/tmp/hello.txt' } },
      null,
      2,
    );
    // Use a callModel that returns tool-call text first, then empty text to stop the loop
    let callCount = 0;
    const deps: QueryDeps = {
      callModel: async function* () {
        callCount++;
        if (callCount === 1) {
          yield { type: 'text', content: `I'll read the file.\n${formattedJson}` };
          yield { type: 'done', finishReason: 'stop' };
        } else {
          yield { type: 'text', content: 'Done.' };
          yield { type: 'done', finishReason: 'stop' };
        }
      },
      microcompact: (msgs) => msgs,
      autocompact: (msgs) => msgs,
      uuid: () => 'test-uuid',
      getTool: () => undefined,
      toolContext: mockToolContext,
    };
    const results: Message[] = [];
    for await (const msg of queryLoop([{ role: 'user', content: 'Read it' }], deps, { model: 'test' })) {
      results.push(msg);
    }
    const assistantMsg = results.find(m => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg!.toolCalls).toBeDefined();
    expect(assistantMsg!.toolCalls!.length).toBe(1);
    expect(assistantMsg!.toolCalls![0].function.name).toBe('ReadFile');
  });

  it('should parse multiple tool calls from a single text response', async () => {
    const call1 = JSON.stringify({ name: 'ReadFile', arguments: { path: '/a.txt' } });
    const call2 = JSON.stringify({ name: 'ReadFile', arguments: { path: '/b.txt' } });
    let callCount = 0;
    const deps: QueryDeps = {
      callModel: async function* () {
        callCount++;
        if (callCount === 1) {
          yield { type: 'text', content: `Reading both files: ${call1} and ${call2}` };
          yield { type: 'done', finishReason: 'stop' };
        } else {
          yield { type: 'text', content: 'Done.' };
          yield { type: 'done', finishReason: 'stop' };
        }
      },
      microcompact: (msgs) => msgs,
      autocompact: (msgs) => msgs,
      uuid: () => 'test-uuid',
      getTool: () => undefined,
      toolContext: mockToolContext,
    };
    const results: Message[] = [];
    for await (const msg of queryLoop([{ role: 'user', content: 'Read them' }], deps, { model: 'test' })) {
      results.push(msg);
    }
    const assistantMsg = results.find(m => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg!.toolCalls).toBeDefined();
    expect(assistantMsg!.toolCalls!.length).toBe(2);
    expect(assistantMsg!.toolCalls![0].function.name).toBe('ReadFile');
    expect(assistantMsg!.toolCalls![1].function.name).toBe('ReadFile');
  });

  it('should parse {"tool": "Name", "input": {...}} format from text', async () => {
    const altFormat = JSON.stringify({ tool: 'SearchWeb', input: { query: 'test search' } });
    let callCount = 0;
    const deps: QueryDeps = {
      callModel: async function* () {
        callCount++;
        if (callCount === 1) {
          yield { type: 'text', content: `Let me search: ${altFormat}` };
          yield { type: 'done', finishReason: 'stop' };
        } else {
          yield { type: 'text', content: 'Done.' };
          yield { type: 'done', finishReason: 'stop' };
        }
      },
      microcompact: (msgs) => msgs,
      autocompact: (msgs) => msgs,
      uuid: () => 'test-uuid',
      getTool: () => undefined,
      toolContext: mockToolContext,
    };
    const results: Message[] = [];
    for await (const msg of queryLoop([{ role: 'user', content: 'Search' }], deps, { model: 'test' })) {
      results.push(msg);
    }
    const assistantMsg = results.find(m => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg!.toolCalls).toBeDefined();
    expect(assistantMsg!.toolCalls!.length).toBe(1);
    expect(assistantMsg!.toolCalls![0].function.name).toBe('SearchWeb');
  });
});
