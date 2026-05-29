import { describe, it, expect, beforeEach } from 'vitest';
import { CostTracker, MODEL_PRICING } from '../../src/cost-tracker.js';

describe('CostTracker', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker();
  });

  describe('calculateCost', () => {
    it('should calculate cost for mimo-large', () => {
      const cost = tracker.calculateCost('mimo-large', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      });
      // 1M input * $3/1M + 1M output * $15/1M = $18
      expect(cost).toBe(18);
    });

    it('should calculate cost for gpt-4o', () => {
      const cost = tracker.calculateCost('gpt-4o', {
        inputTokens: 500_000,
        outputTokens: 200_000,
      });
      // 0.5M * $2.5 + 0.2M * $10 = $1.25 + $2 = $3.25
      expect(cost).toBeCloseTo(3.25, 4);
    });

    it('should calculate cost for claude-sonnet', () => {
      const cost = tracker.calculateCost('claude-sonnet', {
        inputTokens: 100_000,
        outputTokens: 50_000,
      });
      // 0.1M * $3 + 0.05M * $15 = $0.3 + $0.75 = $1.05
      expect(cost).toBeCloseTo(1.05, 4);
    });

    it('should return 0 for unknown model', () => {
      const cost = tracker.calculateCost('unknown-model', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      });
      expect(cost).toBe(0);
    });

    it('should handle zero tokens', () => {
      const cost = tracker.calculateCost('mimo-large', {
        inputTokens: 0,
        outputTokens: 0,
      });
      expect(cost).toBe(0);
    });
  });

  describe('record', () => {
    it('should store an entry and return the cost', () => {
      const cost = tracker.record('mimo-large', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      });
      expect(cost).toBe(18);
      expect(tracker.getEntries()).toHaveLength(1);
      expect(tracker.getEntries()[0].model).toBe('mimo-large');
      expect(tracker.getEntries()[0].inputTokens).toBe(1_000_000);
      expect(tracker.getEntries()[0].outputTokens).toBe(1_000_000);
    });

    it('should accumulate multiple entries', () => {
      tracker.record('mimo-large', { inputTokens: 100, outputTokens: 200 });
      tracker.record('gpt-4o', { inputTokens: 300, outputTokens: 400 });
      expect(tracker.getEntries()).toHaveLength(2);
    });
  });

  describe('getTotalCost', () => {
    it('should return 0 when empty', () => {
      expect(tracker.getTotalCost()).toBe(0);
    });

    it('should sum all recorded costs', () => {
      tracker.record('mimo-large', { inputTokens: 1_000_000, outputTokens: 0 });
      // $3.00
      tracker.record('gpt-4o', { inputTokens: 0, outputTokens: 1_000_000 });
      // $10.00
      expect(tracker.getTotalCost()).toBeCloseTo(13, 4);
    });
  });

  describe('getCostByModel', () => {
    it('should return empty object when no entries', () => {
      expect(tracker.getCostByModel()).toEqual({});
    });

    it('should group costs by model', () => {
      tracker.record('mimo-large', { inputTokens: 1_000_000, outputTokens: 0 });
      tracker.record('mimo-large', { inputTokens: 0, outputTokens: 1_000_000 });
      tracker.record('gpt-4o', { inputTokens: 1_000_000, outputTokens: 0 });

      const byModel = tracker.getCostByModel();
      expect(Object.keys(byModel)).toHaveLength(2);
      expect(byModel['mimo-large']).toBeCloseTo(18, 4); // $3 + $15
      expect(byModel['gpt-4o']).toBeCloseTo(2.5, 4);
    });
  });

  describe('reset', () => {
    it('should clear all entries', () => {
      tracker.record('mimo-large', { inputTokens: 100, outputTokens: 200 });
      tracker.reset();
      expect(tracker.getEntries()).toHaveLength(0);
      expect(tracker.getTotalCost()).toBe(0);
    });
  });

  describe('MODEL_PRICING', () => {
    it('should include all expected models', () => {
      const models = Object.keys(MODEL_PRICING);
      expect(models).toContain('mimo-large');
      expect(models).toContain('mimo-medium');
      expect(models).toContain('mimo-small');
      expect(models).toContain('gpt-4o');
      expect(models).toContain('claude-sonnet');
    });

    it('should accept custom pricing', () => {
      const custom = new CostTracker({
        'custom-model': { inputPricePer1M: 10, outputPricePer1M: 20 },
      });
      const cost = custom.calculateCost('custom-model', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      });
      expect(cost).toBe(30);
    });
  });
});
