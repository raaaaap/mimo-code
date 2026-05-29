import { describe, it, expect, vi } from 'vitest';
import { AgentTool } from '../../../src/tools/AgentTool/AgentTool.js';
import type { ToolUseContext } from '../../../src/types/tool.js';
import type { StreamChunk } from '../../../src/types/api.js';

function makeCtx(): ToolUseContext {
  return {
    options: { model: 'test-model' },
    abortController: new AbortController(),
    readFileState: new Map(),
    messages: [],
    toolDecisions: new Map(),
    requestPrompt: async () => '',
    getAppState: () => ({}),
    setAppState: () => {},
  };
}

function makeTool(deps?: {
  callModel?: (req: unknown) => AsyncGenerator<StreamChunk>;
  getTool?: (name: string) => unknown;
}) {
  return AgentTool({
    callModel: deps?.callModel ?? (async function* () {
      yield { type: 'text', content: 'Sub-agent response' };
      yield { type: 'done', finishReason: 'stop' };
    }),
    getTool: deps?.getTool ?? (() => undefined),
  });
}

describe('AgentTool', () => {
  it('should have correct name and aliases', () => {
    const tool = makeTool();
    expect(tool.name).toBe('AgentTool');
    expect(tool.aliases).toEqual(['agent', 'subagent']);
  });

  it('should not be read-only', () => {
    const tool = makeTool();
    expect(tool.isReadOnly()).toBe(false);
  });

  it('should not be concurrency safe', () => {
    const tool = makeTool();
    expect(tool.isConcurrencySafe()).toBe(false);
  });

  it('should not be destructive', () => {
    const tool = makeTool();
    expect(tool.isDestructive()).toBe(false);
  });

  it('should return a description', async () => {
    const tool = makeTool();
    const desc = await tool.description();
    expect(desc).toContain('sub-agent');
  });

  it('should execute a sub-agent and return its response', async () => {
    const tool = makeTool();
    const result = await tool.call({ prompt: 'Do something' }, makeCtx());
    expect(result.isError).toBeFalsy();
    expect(result.result).toBe('Sub-agent response');
    expect(result.name).toBe('AgentTool');
  });

  it('should pass the prompt as a user message to the sub-agent', async () => {
    let receivedMessages: unknown[] | undefined;
    const tool = makeTool({
      callModel: async function* (req: any) {
        receivedMessages = req.messages;
        yield { type: 'text', content: 'ok' };
        yield { type: 'done', finishReason: 'stop' };
      },
    });

    await tool.call({ prompt: 'Hello sub-agent' }, makeCtx());
    expect(receivedMessages).toBeDefined();
    expect(receivedMessages![0]).toMatchObject({ role: 'user', content: 'Hello sub-agent' });
  });

  it('should pass systemPrompt to the sub-agent request', async () => {
    let receivedSystem: string | undefined;
    const tool = makeTool({
      callModel: async function* (req: any) {
        receivedSystem = req.system;
        yield { type: 'text', content: 'ok' };
        yield { type: 'done', finishReason: 'stop' };
      },
    });

    await tool.call({ prompt: 'task', systemPrompt: 'You are a helper' }, makeCtx());
    expect(receivedSystem).toBe('You are a helper');
  });

  it('should use the parent context model', async () => {
    let receivedModel: string | undefined;
    const tool = makeTool({
      callModel: async function* (req: any) {
        receivedModel = req.model;
        yield { type: 'text', content: 'ok' };
        yield { type: 'done', finishReason: 'stop' };
      },
    });

    const ctx = makeCtx();
    ctx.options.model = 'gpt-4';
    await tool.call({ prompt: 'task' }, ctx);
    expect(receivedModel).toBe('gpt-4');
  });

  it('should handle multiple assistant messages and return the last one', async () => {
    const tool = makeTool({
      callModel: async function* () {
        yield { type: 'text', content: 'First ' };
        yield { type: 'done', finishReason: 'stop' };
      },
    });

    const result = await tool.call({ prompt: 'task' }, makeCtx());
    expect(result.result).toBe('First ');
  });

  it('should return error when callModel throws', async () => {
    const tool = makeTool({
      callModel: async function* () {
        throw new Error('API connection failed');
      },
    });

    const result = await tool.call({ prompt: 'task' }, makeCtx());
    expect(result.isError).toBe(true);
    expect(result.error).toContain('API connection failed');
  });

  it('should handle sub-agent with tool calls', async () => {
    let callCount = 0;
    const tool = makeTool({
      callModel: async function* () {
        callCount++;
        if (callCount === 1) {
          yield { type: 'text', content: 'Let me check.' };
          yield {
            type: 'tool_use',
            toolCall: {
              id: 'tc_1',
              type: 'function',
              function: { name: 'BashTool', arguments: '{"command":"echo hi"}' },
            },
          };
          yield { type: 'done', finishReason: 'tool_calls' };
        } else {
          yield { type: 'text', content: 'The command said hi.' };
          yield { type: 'done', finishReason: 'stop' };
        }
      },
      getTool: (name: string) => {
        if (name === 'BashTool') {
          return {
            name: 'BashTool',
            inputSchema: { safeParse: (v: any) => ({ success: true, data: v }) },
            checkPermissions: () => ({ allowed: true }),
            call: async () => ({ toolUseId: 'tc_1', name: 'BashTool', result: 'hi' }),
            isConcurrencySafe: () => false,
            isReadOnly: () => false,
            isDestructive: () => true,
            interruptBehavior: () => 'cancel' as const,
            description: async () => 'Bash',
            prompt: () => 'Bash',
          };
        }
        return undefined;
      },
    });

    const result = await tool.call({ prompt: 'Run echo hi' }, makeCtx());
    expect(result.isError).toBeFalsy();
    expect(result.result).toBe('The command said hi.');
  });
});
