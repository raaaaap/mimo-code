import { describe, it, expect, vi } from 'vitest';
import { ContextManager } from '../../../src/services/compact/contextManager.js';
import type { Message } from '../../../src/types/message.js';

function msg(role: Message['role'], content: string, extra?: Partial<Message>): Message {
  return { role, content, ...extra };
}

describe('ContextManager', () => {
  describe('microcompact', () => {
    it('truncates long tool outputs', () => {
      const cm = new ContextManager({ maxToolOutputLength: 100 });
      const longContent = 'x'.repeat(200);
      const messages = [msg('tool', longContent, { toolCallId: 'tc1' })];
      const result = cm.microcompact(messages);
      expect(result.compressed).toBe(true);
      expect((result.messages[0]!.content as string).length).toBeLessThan(200);
      expect(result.messages[0]!.content).toContain('[...truncated...]');
    });

    it('removes empty messages', () => {
      const cm = new ContextManager();
      const messages = [msg('user', 'hello'), msg('assistant', ''), msg('user', 'world')];
      const result = cm.microcompact(messages);
      expect(result.compressed).toBe(true);
      expect(result.messages).toHaveLength(2);
      expect(result.removedCount).toBe(1);
    });

    it('keeps non-empty messages unchanged', () => {
      const cm = new ContextManager();
      const messages = [msg('user', 'hello'), msg('assistant', 'hi')];
      const result = cm.microcompact(messages);
      expect(result.compressed).toBe(false);
      expect(result.messages).toHaveLength(2);
    });
  });

  describe('autocompact', () => {
    it('returns unchanged when under threshold', async () => {
      const cm = new ContextManager({ maxTokens: 1000, compactThreshold: 0.8 });
      const messages = [msg('user', 'short')];
      const result = await cm.autocompact(messages);
      expect(result.compressed).toBe(false);
    });

    it('compresses earliest messages when over threshold', async () => {
      const summarize = vi.fn().mockResolvedValue('summary text');
      const cm = new ContextManager({ maxTokens: 20, compactThreshold: 0.5, summarize });
      const messages = Array.from({ length: 10 }, (_, i) =>
        msg(i % 2 === 0 ? 'user' : 'assistant', `message ${i} with some content here`),
      );
      const result = await cm.autocompact(messages);
      expect(result.compressed).toBe(true);
      expect(result.removedCount).toBeGreaterThan(0);
      expect(summarize).toHaveBeenCalled();
      const summaryMsg = result.messages.find(m =>
        typeof m.content === 'string' && m.content.includes('Context compressed'),
      );
      expect(summaryMsg).toBeDefined();
    });

    it('skips compression when fewer than 3 non-system messages', async () => {
      const cm = new ContextManager({ maxTokens: 5, compactThreshold: 0.1 });
      const messages = [msg('user', 'a'), msg('assistant', 'b')];
      const result = await cm.autocompact(messages);
      expect(result.compressed).toBe(false);
    });
  });

  describe('collapseToolSequences', () => {
    it('collapses long tool sequences', () => {
      const cm = new ContextManager();
      const messages = [
        msg('user', 'do stuff'),
        msg('assistant', 'ok', { toolCalls: [{ id: '1', type: 'function', function: { name: 'BashTool', arguments: '{}' } }] }),
        msg('tool', 'r1', { toolCallId: '1' }),
        msg('assistant', 'more', { toolCalls: [{ id: '2', type: 'function', function: { name: 'FileReadTool', arguments: '{}' } }] }),
        msg('tool', 'r2', { toolCallId: '2' }),
        msg('assistant', 'done', { toolCalls: [{ id: '3', type: 'function', function: { name: 'GrepTool', arguments: '{}' } }] }),
        msg('tool', 'r3', { toolCallId: '3' }),
        msg('assistant', 'end', { toolCalls: [{ id: '4', type: 'function', function: { name: 'GlobTool', arguments: '{}' } }] }),
        msg('tool', 'r4', { toolCallId: '4' }),
        msg('user', 'next'),
      ];
      const result = cm.collapseToolSequences(messages);
      expect(result.compressed).toBe(true);
      expect(result.removedCount).toBeGreaterThan(0);
      expect(result.messages.some(m => typeof m.content === 'string' && m.content.includes('Executed'))).toBe(true);
    });

    it('does not collapse short tool sequences', () => {
      const cm = new ContextManager();
      const messages = [
        msg('user', 'do stuff'),
        msg('assistant', 'ok', { toolCalls: [{ id: '1', type: 'function', function: { name: 'BashTool', arguments: '{}' } }] }),
        msg('tool', 'r1', { toolCallId: '1' }),
        msg('user', 'next'),
      ];
      const result = cm.collapseToolSequences(messages);
      expect(result.compressed).toBe(false);
    });
  });

  describe('reactiveCompress', () => {
    it('preserves recent N messages', () => {
      const cm = new ContextManager({ preserveRecent: 3 });
      const messages = [
        msg('system', 'sys'),
        msg('user', 'a'), msg('assistant', 'b'),
        msg('user', 'c'), msg('assistant', 'd'),
        msg('user', 'e'), msg('assistant', 'f'),
      ];
      const result = cm.reactiveCompress(messages);
      expect(result.compressed).toBe(true);
      expect(result.messages).toHaveLength(5);
      expect(result.messages[0]!.role).toBe('system');
      expect(result.messages[1]!.content).toContain('Context compressed');
    });

    it('returns unchanged when few messages', () => {
      const cm = new ContextManager({ preserveRecent: 5 });
      const messages = [msg('user', 'a'), msg('assistant', 'b')];
      const result = cm.reactiveCompress(messages);
      expect(result.compressed).toBe(false);
    });
  });

  describe('compress pipeline', () => {
    it('runs microcompact then autocompact', async () => {
      const cm = new ContextManager({ maxTokens: 1000 });
      const messages = [msg('user', 'hello'), msg('assistant', 'world')];
      const result = await cm.compress(messages);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('countTokens', () => {
    it('delegates to token counter', () => {
      const cm = new ContextManager();
      const messages = [msg('user', 'hello')];
      expect(cm.countTokens(messages)).toBeGreaterThan(0);
    });
  });

  describe('updateMaxTokens', () => {
    it('updates the max tokens', () => {
      const cm = new ContextManager({ maxTokens: 100 });
      expect(cm.maxTokens).toBe(100);
      cm.updateMaxTokens(200);
      expect(cm.maxTokens).toBe(200);
    });
  });
});
