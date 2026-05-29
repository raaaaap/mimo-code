import type { TokenUsage } from '../types/message.js';

const DIMINISHING_THRESHOLD = 500;
const DIMINISHING_COUNT = 3;
const CONTINUE_THRESHOLD = 0.9;

export class TokenBudget {
  readonly maxTokens: number;
  private used = 0;
  private lowIncrementCount = 0;

  constructor(maxTokens: number) {
    this.maxTokens = maxTokens;
  }

  get totalUsed(): number {
    return this.used;
  }

  get remaining(): number {
    return Math.max(0, this.maxTokens - this.used);
  }

  get usageRatio(): number {
    return this.maxTokens > 0 ? this.used / this.maxTokens : 1;
  }

  recordTurn(usage: TokenUsage): void {
    const turnTotal = usage.inputTokens + usage.outputTokens;
    this.used += turnTotal;

    if (turnTotal < DIMINISHING_THRESHOLD) {
      this.lowIncrementCount++;
    } else {
      this.lowIncrementCount = 0;
    }
  }

  shouldContinue(): boolean {
    return this.usageRatio < CONTINUE_THRESHOLD;
  }

  hasDiminishingReturns(): boolean {
    return this.lowIncrementCount >= DIMINISHING_COUNT;
  }

  shouldCompress(): boolean {
    return this.usageRatio >= 0.8;
  }
}
