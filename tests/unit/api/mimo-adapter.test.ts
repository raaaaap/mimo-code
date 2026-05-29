import { describe, it, expect } from 'vitest';
import { MimoAdapter } from '../../../src/services/api/adapters/mimo.js';

describe('MimoAdapter', () => {
  it('supports mimo-* models', () => {
    const adapter = new MimoAdapter('https://api.test.com', 'key');
    expect(adapter.supports('mimo-large')).toBe(true);
    expect(adapter.supports('mimo-medium')).toBe(true);
    expect(adapter.supports('mimo-small')).toBe(true);
    expect(adapter.supports('gpt-4')).toBe(false);
    expect(adapter.supports('claude-3')).toBe(false);
  });

  it('returns correct context window for known models', () => {
    const adapter = new MimoAdapter('https://api.test.com', 'key');
    expect(adapter.getContextWindow('mimo-large')).toBe(128000);
    expect(adapter.getContextWindow('mimo-medium')).toBe(32000);
    expect(adapter.getContextWindow('mimo-small')).toBe(8000);
    expect(adapter.getContextWindow('mimo-unknown')).toBe(128000);
  });

  it('has name "mimo"', () => {
    const adapter = new MimoAdapter('https://api.test.com', 'key');
    expect(adapter.name).toBe('mimo');
  });

  it('countTokens returns positive number', () => {
    const adapter = new MimoAdapter('https://api.test.com', 'key');
    const count = adapter.countTokens([{ role: 'user', content: 'hello' }]);
    expect(count).toBeGreaterThan(0);
  });
});
