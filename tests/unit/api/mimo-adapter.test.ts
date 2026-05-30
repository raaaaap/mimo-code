import { describe, it, expect } from 'vitest';
import { MimoAdapter } from '../../../src/services/api/adapters/mimo.js';

describe('MimoAdapter', () => {
  it('supports mimo-* models', () => {
    const adapter = new MimoAdapter('https://api.test.com', 'key');
    expect(adapter.supports('mimo-v2.5-pro')).toBe(true);
    expect(adapter.supports('mimo-v2.5')).toBe(true);
    expect(adapter.supports('gpt-4')).toBe(false);
    expect(adapter.supports('claude-3')).toBe(false);
  });

  it('returns correct context window for known models', () => {
    const adapter = new MimoAdapter('https://api.test.com', 'key');
    expect(adapter.getContextWindow('mimo-v2.5-pro')).toBe(1000000);
    expect(adapter.getContextWindow('mimo-v2.5')).toBe(1000000);
  });

  it('returns 256000 for unknown mimo models', () => {
    const adapter = new MimoAdapter('https://api.test.com', 'key');
    expect(adapter.getContextWindow('mimo-unknown')).toBe(256000);
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
