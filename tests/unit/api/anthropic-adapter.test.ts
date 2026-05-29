import { describe, it, expect } from 'vitest';
import { AnthropicAdapter } from '../../../src/services/api/adapters/anthropic.js';

describe('AnthropicAdapter', () => {
  it('should support claude models', () => {
    const adapter = new AnthropicAdapter('test-key');
    expect(adapter.supports('claude-opus')).toBe(true);
    expect(adapter.supports('claude-sonnet')).toBe(true);
    expect(adapter.supports('gpt-4o')).toBe(false);
    expect(adapter.supports('mimo-large')).toBe(false);
  });

  it('should report name', () => {
    const adapter = new AnthropicAdapter('test-key');
    expect(adapter.name).toBe('anthropic');
  });
});
