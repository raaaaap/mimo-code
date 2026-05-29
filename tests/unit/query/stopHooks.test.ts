import { describe, it, expect, vi } from 'vitest';
import { executeStopHooks } from '../../../src/query/stopHooks.js';
import type { HookRegistry } from '../../../src/hooks/registry.js';
import type { Message } from '../../../src/types/message.js';

function createMockRegistry(): HookRegistry {
  return {
    execute: vi.fn().mockResolvedValue([]),
  } as unknown as HookRegistry;
}

function createMessage(content: string | { type: 'text'; text: string }[]): Message {
  return {
    role: 'assistant',
    content,
  };
}

describe('executeStopHooks', () => {
  it('calls hooks.execute with SessionEnd event', async () => {
    const hooks = createMockRegistry();
    const messages: Message[] = [createMessage('hello')];

    await executeStopHooks(hooks, messages, 3);

    expect(hooks.execute).toHaveBeenCalledWith('SessionEnd', {
      messageCount: 1,
      turnCount: 3,
      lastMessage: 'hello',
    });
  });

  it('passes correct messageCount', async () => {
    const hooks = createMockRegistry();
    const messages: Message[] = [
      createMessage('a'),
      createMessage('b'),
      createMessage('c'),
    ];

    await executeStopHooks(hooks, messages, 1);

    expect(hooks.execute).toHaveBeenCalledWith('SessionEnd', expect.objectContaining({
      messageCount: 3,
    }));
  });

  it('extracts lastMessage from string content', async () => {
    const hooks = createMockRegistry();
    const messages: Message[] = [createMessage('last one')];

    await executeStopHooks(hooks, messages, 0);

    expect(hooks.execute).toHaveBeenCalledWith('SessionEnd', expect.objectContaining({
      lastMessage: 'last one',
    }));
  });

  it('returns empty string for non-string content', async () => {
    const hooks = createMockRegistry();
    const messages: Message[] = [
      createMessage([{ type: 'text', text: 'ignored' }]),
    ];

    await executeStopHooks(hooks, messages, 0);

    expect(hooks.execute).toHaveBeenCalledWith('SessionEnd', expect.objectContaining({
      lastMessage: '',
    }));
  });

  it('handles empty messages array', async () => {
    const hooks = createMockRegistry();

    await executeStopHooks(hooks, [], 0);

    expect(hooks.execute).toHaveBeenCalledWith('SessionEnd', {
      messageCount: 0,
      turnCount: 0,
      lastMessage: '',
    });
  });

  it('forwards turnCount correctly', async () => {
    const hooks = createMockRegistry();

    await executeStopHooks(hooks, [], 42);

    expect(hooks.execute).toHaveBeenCalledWith('SessionEnd', expect.objectContaining({
      turnCount: 42,
    }));
  });
});
