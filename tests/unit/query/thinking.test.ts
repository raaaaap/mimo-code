import { describe, it, expect } from 'vitest';
import {
  shouldEnableThinking,
  getThinkingBudget,
} from '../../../src/query/thinking.js';

describe('shouldEnableThinking', () => {
  it('returns false when mode is off regardless of prompt', () => {
    expect(shouldEnableThinking('implement a parser', 'off')).toBe(false);
  });

  it('returns true when mode is on regardless of prompt', () => {
    expect(shouldEnableThinking('hello', 'on')).toBe(true);
  });

  it('detects complexity indicators in adaptive mode', () => {
    expect(shouldEnableThinking('implement a new feature', 'adaptive')).toBe(true);
    expect(shouldEnableThinking('design the architecture', 'adaptive')).toBe(true);
    expect(shouldEnableThinking('debug this crash', 'adaptive')).toBe(true);
    expect(shouldEnableThinking('refactor the module', 'adaptive')).toBe(true);
    expect(shouldEnableThinking('optimize performance', 'adaptive')).toBe(true);
  });

  it('returns false in adaptive mode for simple prompts', () => {
    expect(shouldEnableThinking('hello', 'adaptive')).toBe(false);
    expect(shouldEnableThinking('what is 2+2', 'adaptive')).toBe(false);
    expect(shouldEnableThinking('list files', 'adaptive')).toBe(false);
  });

  it('is case-insensitive for complexity detection', () => {
    expect(shouldEnableThinking('IMPLEMENT this', 'adaptive')).toBe(true);
    expect(shouldEnableThinking('Debug the issue', 'adaptive')).toBe(true);
  });
});

describe('getThinkingBudget', () => {
  it('returns 0 when mode is off', () => {
    expect(getThinkingBudget('implement everything', { mode: 'off', budgetTokens: 0 })).toBe(0);
  });

  it('returns explicit budget when budgetTokens is set', () => {
    expect(getThinkingBudget('hello', { mode: 'on', budgetTokens: 5000 })).toBe(5000);
  });

  it('returns larger budget for complex prompts when budgetTokens is 0', () => {
    const budget = getThinkingBudget('implement a distributed system', {
      mode: 'adaptive',
      budgetTokens: 0,
    });
    expect(budget).toBe(20000);
  });

  it('returns default budget for simple prompts when budgetTokens is 0', () => {
    const budget = getThinkingBudget('hello world', {
      mode: 'adaptive',
      budgetTokens: 0,
    });
    expect(budget).toBe(10000);
  });
});
