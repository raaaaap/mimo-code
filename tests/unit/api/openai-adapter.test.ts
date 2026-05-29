import { describe, it, expect } from 'vitest';
import { OpenAIAdapter } from '../../../src/services/api/adapters/openai.js';

describe('OpenAIAdapter', () => {
  it('should support openai-compatible models', () => {
    const adapter = new OpenAIAdapter('https://api.openai.com/v1', 'test-key');
    expect(adapter.supports('gpt-4o')).toBe(true);
    expect(adapter.supports('mimo-large')).toBe(true);
    expect(adapter.supports('claude-opus')).toBe(false);
  });

  it('should report name', () => {
    const adapter = new OpenAIAdapter('https://api.openai.com/v1', 'test-key');
    expect(adapter.name).toBe('openai');
  });
});
