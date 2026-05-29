import { describe, it, expect } from 'vitest';
import { shouldSummarize, truncateToolOutput, summarizeToolOutput } from '../../../src/services/tools/toolSummary.js';

describe('shouldSummarize', () => {
  it('returns true for output over 5000 chars', () => {
    expect(shouldSummarize('x'.repeat(5001))).toBe(true);
  });

  it('returns false for output under 5000 chars', () => {
    expect(shouldSummarize('short output')).toBe(false);
  });

  it('respects custom max length', () => {
    expect(shouldSummarize('abc', 2)).toBe(true);
    expect(shouldSummarize('abc', 10)).toBe(false);
  });
});

describe('truncateToolOutput', () => {
  it('keeps first 500 and last 500 chars with marker', () => {
    const input = 'a'.repeat(6000);
    const result = truncateToolOutput(input, 5000);
    expect(result.length).toBeLessThan(6000);
    expect(result.startsWith('a'.repeat(500))).toBe(true);
    expect(result.endsWith('a'.repeat(500))).toBe(true);
    expect(result).toContain('[...truncated');
  });

  it('returns original if under limit', () => {
    const input = 'short';
    expect(truncateToolOutput(input, 5000)).toBe(input);
  });
});

describe('summarizeToolOutput', () => {
  it('returns original for short output', () => {
    expect(summarizeToolOutput('hello')).toBe('hello');
  });

  it('truncates long output', () => {
    const long = 'x'.repeat(6000);
    const result = summarizeToolOutput(long);
    expect(result.length).toBeLessThan(6000);
  });
});
