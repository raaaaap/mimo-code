import { describe, it, expect } from 'vitest';
import { TokenBudget } from '../../../src/query/tokenBudget.js';

describe('TokenBudget', () => {
  it('tracks token usage across turns', () => {
    const budget = new TokenBudget(8000);
    budget.recordTurn({ inputTokens: 1000, outputTokens: 500 });
    expect(budget.totalUsed).toBe(1500);
    expect(budget.remaining).toBe(6500);
  });

  it('returns true for shouldContinue when under threshold', () => {
    const budget = new TokenBudget(8000);
    budget.recordTurn({ inputTokens: 3000, outputTokens: 1000 });
    expect(budget.shouldContinue()).toBe(true);
  });

  it('returns false for shouldContinue when over 90% threshold', () => {
    const budget = new TokenBudget(100);
    budget.recordTurn({ inputTokens: 50, outputTokens: 45 });
    expect(budget.shouldContinue()).toBe(false);
  });

  it('detects diminishing returns after 3 low-increment turns', () => {
    const budget = new TokenBudget(8000);
    budget.recordTurn({ inputTokens: 100, outputTokens: 100 });
    budget.recordTurn({ inputTokens: 100, outputTokens: 100 });
    budget.recordTurn({ inputTokens: 100, outputTokens: 100 });
    expect(budget.hasDiminishingReturns()).toBe(true);
  });

  it('does not flag diminishing returns if increments are large', () => {
    const budget = new TokenBudget(8000);
    budget.recordTurn({ inputTokens: 1000, outputTokens: 1000 });
    budget.recordTurn({ inputTokens: 1000, outputTokens: 1000 });
    budget.recordTurn({ inputTokens: 1000, outputTokens: 1000 });
    expect(budget.hasDiminishingReturns()).toBe(false);
  });

  it('resets diminishing returns counter on large increment', () => {
    const budget = new TokenBudget(8000);
    budget.recordTurn({ inputTokens: 100, outputTokens: 100 });
    budget.recordTurn({ inputTokens: 100, outputTokens: 100 });
    budget.recordTurn({ inputTokens: 2000, outputTokens: 1000 });
    budget.recordTurn({ inputTokens: 100, outputTokens: 100 });
    expect(budget.hasDiminishingReturns()).toBe(false);
  });

  it('shouldCompress returns true at 80% usage', () => {
    const budget = new TokenBudget(100);
    budget.recordTurn({ inputTokens: 40, outputTokens: 40 });
    expect(budget.shouldCompress()).toBe(true);
  });
});
