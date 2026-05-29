import { describe, it, expect } from 'vitest';
import { EstimatedTokenCounter } from '../../../src/services/compact/tokenCounter.js';

describe('EstimatedTokenCounter', () => {
  const counter = new EstimatedTokenCounter();

  it('counts plain text messages', () => {
    const msgs = [{ role: 'user' as const, content: 'hello world' }];
    expect(counter.countMessages(msgs)).toBe(7);
  });

  it('counts multi-part content', () => {
    const msgs = [{
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: 'hello' },
        { type: 'text' as const, text: 'world' },
      ],
    }];
    expect(counter.countMessages(msgs)).toBe(8);
  });

  it('counts tool calls', () => {
    const msgs = [{
      role: 'assistant' as const,
      content: 'ok',
      toolCalls: [{
        id: 'tc1',
        type: 'function' as const,
        function: { name: 'BashTool', arguments: '{"cmd":"ls"}' },
      }],
    }];
    expect(counter.countMessages(msgs)).toBe(10);
  });

  it('counts tool result messages', () => {
    const msgs = [{ role: 'tool' as const, content: 'result text', toolCallId: 'tc1' }];
    expect(counter.countMessages(msgs)).toBe(8);
  });

  it('counts multiple messages', () => {
    const msgs = [
      { role: 'user' as const, content: 'hi' },
      { role: 'assistant' as const, content: 'hello' },
    ];
    expect(counter.countMessages(msgs)).toBe(counter.countMessages([msgs[0]]) + counter.countMessages([msgs[1]]));
  });

  it('countText returns ceil(length/4)', () => {
    expect(counter.countText('abcdefgh')).toBe(2);
    expect(counter.countText('abcdefghi')).toBe(3);
  });
});
