/**
 * Cost tracking for LLM API usage.
 *
 * Records per-request cost using a model pricing table with tiered pricing
 * (by context window length) and cache hit pricing support.
 */

export interface ContextTier {
  threshold: number;            // context ceiling (tokens)
  inputPricePer1M: number;      // input price $/1M tokens
  cacheInputPricePer1M: number; // cache hit price $/1M tokens
  outputPricePer1M: number;     // output price $/1M tokens
}

export interface ModelPricing {
  tiers: ContextTier[];         // sorted by threshold ascending
}

/** Default pricing table (USD per 1 M tokens). */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'mimo-v2.5-pro': {
    tiers: [
      { threshold: 256_000, inputPricePer1M: 1.0, cacheInputPricePer1M: 0.2, outputPricePer1M: 3.0 },
      { threshold: 1_000_000, inputPricePer1M: 2.0, cacheInputPricePer1M: 0.4, outputPricePer1M: 6.0 },
    ],
  },
  'mimo-v2.5': {
    tiers: [
      { threshold: 256_000, inputPricePer1M: 0.4, cacheInputPricePer1M: 0.08, outputPricePer1M: 2.0 },
      { threshold: 1_000_000, inputPricePer1M: 0.8, cacheInputPricePer1M: 0.16, outputPricePer1M: 4.0 },
    ],
  },
  'gpt-4o': {
    tiers: [
      { threshold: 1_000_000, inputPricePer1M: 2.5, cacheInputPricePer1M: 2.5, outputPricePer1M: 10.0 },
    ],
  },
  'claude-sonnet': {
    tiers: [
      { threshold: 1_000_000, inputPricePer1M: 3.0, cacheInputPricePer1M: 3.0, outputPricePer1M: 15.0 },
    ],
  },
};

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface CostEntry {
  model: string;
  inputTokens: number;
  outputTokens: number;
  contextTokens: number;
  cacheHit: boolean;
  cost: number;
  timestamp: number;
}

export class CostTracker {
  private entries: CostEntry[] = [];
  private pricing: Record<string, ModelPricing>;

  constructor(pricing: Record<string, ModelPricing> = MODEL_PRICING) {
    this.pricing = pricing;
  }

  /**
   * Select the appropriate tier for the given context token count.
   * Returns the first tier whose threshold >= contextTokens,
   * or the last tier if contextTokens exceeds all thresholds.
   */
  private selectTier(pricing: ModelPricing, contextTokens: number): ContextTier {
    return pricing.tiers.find(t => contextTokens <= t.threshold)
      ?? pricing.tiers[pricing.tiers.length - 1];
  }

  /**
   * Calculate the cost for a given model and token usage.
   * Returns 0 if the model is not in the pricing table.
   *
   * @param contextTokens - Total context tokens (determines pricing tier). Defaults to 0 (lowest tier).
   * @param cacheHit - Whether input tokens hit the cache. Defaults to false.
   */
  calculateCost(model: string, usage: TokenUsage, contextTokens: number = 0, cacheHit: boolean = false): number {
    const pricing = this.pricing[model];
    if (!pricing) return 0;

    const tier = this.selectTier(pricing, contextTokens);
    const inputPrice = cacheHit ? tier.cacheInputPricePer1M : tier.inputPricePer1M;
    const inputCost = (usage.inputTokens / 1_000_000) * inputPrice;
    const outputCost = (usage.outputTokens / 1_000_000) * tier.outputPricePer1M;
    return inputCost + outputCost;
  }

  /**
   * Record a usage event. Calculates and stores the cost.
   * Returns the computed cost.
   *
   * @param contextTokens - Total context tokens (determines pricing tier). Defaults to 0 (lowest tier).
   * @param cacheHit - Whether input tokens hit the cache. Defaults to false.
   */
  record(model: string, usage: TokenUsage, contextTokens: number = 0, cacheHit: boolean = false): number {
    const cost = this.calculateCost(model, usage, contextTokens, cacheHit);
    this.entries.push({
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      contextTokens,
      cacheHit,
      cost,
      timestamp: Date.now(),
    });
    return cost;
  }

  /** Return every recorded entry. */
  getEntries(): ReadonlyArray<CostEntry> {
    return this.entries;
  }

  /** Sum of all recorded costs. */
  getTotalCost(): number {
    return this.entries.reduce((sum, e) => sum + e.cost, 0);
  }

  /** Cost broken down by model name. */
  getCostByModel(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const entry of this.entries) {
      breakdown[entry.model] = (breakdown[entry.model] ?? 0) + entry.cost;
    }
    return breakdown;
  }

  /** Clear all recorded entries. */
  reset(): void {
    this.entries = [];
  }
}
