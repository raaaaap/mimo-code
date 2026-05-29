import { describe, it, expect } from 'vitest';
import type { Message, ToolCall, ToolDefinition } from '../../src/types/index.js';

describe('Core Types', () => {
  it('should create a user message', () => {
    const msg: Message = {
      role: 'user',
      content: 'Hello Mimo',
    };
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('Hello Mimo');
  });

  it('should create an assistant message with tool calls', () => {
    const toolCall: ToolCall = {
      id: 'call_1',
      type: 'function',
      function: {
        name: 'BashTool',
        arguments: '{"command": "ls"}',
      },
    };
    const msg: Message = {
      role: 'assistant',
      content: 'Let me check.',
      toolCalls: [toolCall],
    };
    expect(msg.toolCalls).toHaveLength(1);
    expect(msg.toolCalls![0].function.name).toBe('BashTool');
  });

  it('should create a tool result message', () => {
    const msg: Message = {
      role: 'tool',
      content: 'file1.ts\nfile2.ts',
      toolCallId: 'call_1',
    };
    expect(msg.role).toBe('tool');
    expect(msg.toolCallId).toBe('call_1');
  });

  it('should create a tool definition in OpenAI format', () => {
    const def: ToolDefinition = {
      type: 'function',
      function: {
        name: 'BashTool',
        description: 'Execute a shell command',
        parameters: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'The command to execute' },
          },
          required: ['command'],
        },
      },
    };
    expect(def.type).toBe('function');
    expect(def.function.name).toBe('BashTool');
  });
});
