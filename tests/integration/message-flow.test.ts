import { describe, it, expect } from 'vitest';
import type { Message } from '../../src/types/message.js';
import type { ModelRequest, StreamChunk } from '../../src/types/api.js';

class MockAdapter {
  readonly name = 'mock';

  async *streamChat(request: ModelRequest): AsyncGenerator<StreamChunk> {
    yield { type: 'text', content: 'Hello! ' };
    yield { type: 'text', content: 'How can I help?' };
    yield { type: 'done', finishReason: 'stop', usage: { inputTokens: 10, outputTokens: 5 } };
  }

  async chat(request: ModelRequest) {
    return {
      content: 'Hello! How can I help?',
      usage: { inputTokens: 10, outputTokens: 5 },
      finishReason: 'stop',
    };
  }

  countTokens(messages: Message[]) {
    return messages.reduce((sum, m) => sum + (typeof m.content === 'string' ? m.content.length : 0), 0);
  }

  supports() { return true; }
}

describe('Message Flow Integration', () => {
  it('should stream a complete assistant response', async () => {
    const adapter = new MockAdapter();
    const messages: Message[] = [{ role: 'user', content: 'Hello' }];
    const chunks: StreamChunk[] = [];

    for await (const chunk of adapter.streamChat({ model: 'test', messages })) {
      chunks.push(chunk);
    }

    const textChunks = chunks.filter(c => c.type === 'text');
    const doneChunk = chunks.find(c => c.type === 'done');

    expect(textChunks.map(c => c.content).join('')).toBe('Hello! How can I help?');
    expect(doneChunk?.finishReason).toBe('stop');
    expect(doneChunk?.usage?.inputTokens).toBe(10);
  });

  it('should handle multi-turn conversation', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'What is 2+2?' },
    ];
    const adapter = new MockAdapter();
    const result = await adapter.chat({ model: 'test', messages });
    expect(result.content).toBeTruthy();
  });

  it('should count tokens correctly', () => {
    const adapter = new MockAdapter();
    const messages: Message[] = [
      { role: 'user', content: 'Hello world' },
      { role: 'assistant', content: 'Hi there!' },
    ];
    expect(adapter.countTokens(messages)).toBe(20);
  });

  it('should report adapter name', () => {
    const adapter = new MockAdapter();
    expect(adapter.name).toBe('mock');
  });
});
