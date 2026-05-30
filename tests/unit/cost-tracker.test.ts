import { describe, it, expect, beforeEach } from 'vitest';
import { CostTracker, MODEL_PRICING } from '../../src/cost-tracker.js';

describe('CostTracker', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker();
  });

  describe('calculateCost', () => {
    it('should calculate cost for mimo-v2.5-pro at ≤256K tier', () => {
      const cost = tracker.calculateCost('mimo-v2.5-pro', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      }, 200_000);
      expect(cost).toBe(4);
    });

    it('should calculate cost for mimo-v2.5-pro at ≤1M tier', () => {
      const cost = tracker.calculateCost('mimo-v2.5-pro', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      }, 500_000);
      expect(cost).toBe(8);
    });

    it('should calculate cost for mimo-v2.5 at ≤256K tier', () => {
      const cost = tracker.calculateCost('mimo-v2.5', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      }, 100_000);
      expect(cost).toBeCloseTo(2.4, 4);
    });

    it('should calculate cost for mimo-v2.5 at ≤1M tier', () => {
      const cost = tracker.calculateCost('mimo-v2.5', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      }, 800_000);
      expect(cost).toBeCloseTo(4.8, 4);
    });

    it('should use cache price when cacheHit is true', () => {
      const cost = tracker.calculateCost('mimo-v2.5-pro', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      }, 200_000, true);
      expect(cost).toBeCloseTo(3.2, 4);
    });

    it('should use cache price at ≤1M tier when cacheHit is true', () => {
      const cost = tracker.calculateCost('mimo-v2.5', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      }, 500_000, true);
      expect(cost).toBeCloseTo(4.16, 4);
    });

    it('should use lowest tier when contextTokens is 0 (default)', () => {
      const cost = tracker.calculateCost('mimo-v2.5-pro', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      });
      expect(cost).toBe(4);
    });

    it('should use highest tier when contextTokens exceeds all thresholds', () => {
      const cost = tracker.calculateCost('mimo-v2.5-pro', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      }, 2_000_000);
      expect(cost).toBe(8);
    });

    it('should calculate cost for gpt-4o (single tier)', () => {
      const cost = tracker.calculateCost('gpt-4o', {
        inputTokens: 500_000,
        outputTokens: 200_000,
      });
      expect(cost).toBeCloseTo(3.25, 4);
    });

    it('should calculate cost for claude-sonnet (single tier)', () => {
      const cost = tracker.calculateCost('claude-sonnet', {
        inputTokens: 100_000,
        outputTokens: 50_000,
      });
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
      const cost = tracker.calculateCost('mimo-v2.5-pro', {
        inputTokens: 0,
        outputTokens: 0,
      });
      expect(cost).toBe(0);
    });
  });

  describe('record', () => {
    it('should store an entry with contextTokens and cacheHit', () => {
      const cost = tracker.record('mimo-v2.5-pro', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      }, 200_000, false);
      expect(cost).toBe(4);
      const entries = tracker.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].model).toBe('mimo-v2.5-pro');
      expect(entries[0].inputTokens).toBe(1_000_000);
      expect(entries[0].outputTokens).toBe(1_000_000);
      expect(entries[0].contextTokens).toBe(200_000);
      expect(entries[0].cacheHit).toBe(false);
    });

    it('should default contextTokens to 0 and cacheHit to false', () => {
      const cost = tracker.record('mimo-v2.5', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      });
      expect(cost).toBeCloseTo(2.4, 4);
      const entries = tracker.getEntries();
      expect(entries[0].contextTokens).toBe(0);
      expect(entries[0].cacheHit).toBe(false);
    });

    it('should accumulate multiple entries', () => {
      tracker.record('mimo-v2.5-pro', { inputTokens: 100, outputTokens: 200 });
      tracker.record('gpt-4o', { inputTokens: 300, outputTokens: 400 });
      expect(tracker.getEntries()).toHaveLength(2);
    });
  });

  describe('getTotalCost', () => {
    it('should return 0 when empty', () => {
      expect(tracker.getTotalCost()).toBe(0);
    });

    it('should sum all recorded costs', () => {
      tracker.record('mimo-v2.5-pro', { inputTokens: 1_000_000, outputTokens: 0 }, 200_000);
      tracker.record('gpt-4o', { inputTokens: 0, outputTokens: 1_000_000 });
      expect(tracker.getTotalCost()).toBeCloseTo(11, 4);
    });
  });

  describe('getCostByModel', () => {
    it('should return empty object when no entries', () => {
      expect(tracker.getCostByModel()).toEqual({});
    });

    it('should group costs by model', () => {
      tracker.record('mimo-v2.5-pro', { inputTokens: 1_000_000, outputTokens: 0 }, 200_000);
      tracker.record('mimo-v2.5-pro', { inputTokens: 0, outputTokens: 1_000_000 }, 200_000);
      tracker.record('gpt-4o', { inputTokens: 1_000_000, outputTokens: 0 });

      const byModel = tracker.getCostByModel();
      expect(Object.keys(byModel)).toHaveLength(2);
      expect(byModel['mimo-v2.5-pro']).toBeCloseTo(4, 4);
      expect(byModel['gpt-4o']).toBeCloseTo(2.5, 4);
    });
  });

  describe('reset', () => {
    it('should clear all entries', () => {
      tracker.record('mimo-v2.5-pro', { inputTokens: 100, outputTokens: 200 });
      tracker.reset();
      expect(tracker.getEntries()).toHaveLength(0);
      expect(tracker.getTotalCost()).toBe(0);
    });
  });

  describe('MODEL_PRICING', () => {
    it('should include all expected models with tiers', () => {
      const models = Object.keys(MODEL_PRICING);
      expect(models).toContain('mimo-v2.5-pro');
      expect(models).toContain('mimo-v2.5');
      expect(models).toContain('gpt-4o');
      expect(models).toContain('claude-sonnet');
      expect(models).not.toContain('mimo-large');
      expect(models).not.toContain('mimo-medium');
      expect(models).not.toContain('mimo-small');
    });

    it('should have correct tier structure for mimo-v2.5-pro', () => {
      const pricing = MODEL_PRICING['mimo-v2.5-pro'];
      expect(pricing.tiers).toHaveLength(2);
      expect(pricing.tiers[0].threshold).toBe(256_000);
      expect(pricing.tiers[0].inputPricePer1M).toBe(1.0);
      expect(pricing.tiers[0].cacheInputPricePer1M).toBe(0.2);
      expect(pricing.tiers[0].outputPricePer1M).toBe(3.0);
      expect(pricing.tiers[1].threshold).toBe(1_000_000);
      expect(pricing.tiers[1].inputPricePer1M).toBe(2.0);
      expect(pricing.tiers[1].cacheInputPricePer1M).toBe(0.4);
      expect(pricing.tiers[1].outputPricePer1M).toBe(6.0);
    });

    it('should have correct tier structure for mimo-v2.5', () => {
      const pricing = MODEL_PRICING['mimo-v2.5'];
      expect(pricing.tiers).toHaveLength(2);
      expect(pricing.tiers[0].threshold).toBe(256_000);
      expect(pricing.tiers[0].inputPricePer1M).toBe(0.4);
      expect(pricing.tiers[0].cacheInputPricePer1M).toBe(0.08);
      expect(pricing.tiers[0].outputPricePer1M).toBe(2.0);
      expect(pricing.tiers[1].threshold).toBe(1_000_000);
      expect(pricing.tiers[1].inputPricePer1M).toBe(0.8);
      expect(pricing.tiers[1].cacheInputPricePer1M).toBe(0.16);
      expect(pricing.tiers[1].outputPricePer1M).toBe(4.0);
    });

    it('should accept custom pricing with tiers', () => {
      const custom = new CostTracker({
        'custom-model': {
          tiers: [{ threshold: 128_000, inputPricePer1M: 10, cacheInputPricePer1M: 10, outputPricePer1M: 20 }],
        },
      });
      const cost = custom.calculateCost('custom-model', {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      });
      expect(cost).toBe(30);
    });
  });
});
