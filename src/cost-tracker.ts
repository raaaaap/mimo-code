/**
 * Cost tracking for LLM API usage.
 *
 * Records per-request cost using a model pricing table and provides
 * aggregate queries (total, per-model breakdown).
 */

export interface ModelPricing {
  inputPricePer1M: number; // USD per 1 million input tokens
  outputPricePer1M: number; // USD per 1 million output tokens
}

/** Default pricing table (USD per 1 M tokens). */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'mimo-large': { inputPricePer1M: 3.0, outputPricePer1M: 15.0 },
  'mimo-medium': { inputPricePer1M: 1.0, outputPricePer1M: 5.0 },
  'mimo-small': { inputPricePer1M: 0.2, outputPricePer1M: 1.0 },
  'gpt-4o': { inputPricePer1M: 2.5, outputPricePer1M: 10.0 },
  'claude-sonnet': { inputPricePer1M: 3.0, outputPricePer1M: 15.0 },
};

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface CostEntry {
  model: string;
  inputTokens: number;
  outputTokens: number;
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
   * Calculate the cost for a given model and token usage.
   * Returns 0 if the model is not in the pricing table.
   */
  calculateCost(model: string, usage: TokenUsage): number {
    const pricing = this.pricing[model];
    if (!pricing) return 0;

    const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPricePer1M;
    const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputPricePer1M;
    return inputCost + outputCost;
  }

  /**
   * Record a usage event. Calculates and stores the cost.
   * Returns the computed cost.
   */
  record(model: string, usage: TokenUsage): number {
    const cost = this.calculateCost(model, usage);
    this.entries.push({
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
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
