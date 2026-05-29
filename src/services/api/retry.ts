import type { RetryConfig } from '../../types/api.js';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryable(error: unknown, config: RetryConfig): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return config.retryableErrors.some(pattern => message.includes(pattern));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === config.maxRetries || !isRetryable(error, config)) {
        throw error;
      }
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay,
      );
      const jitter = config.jitter ? delay * (0.5 + Math.random() * 0.5) : delay;
      await sleep(jitter);
    }
  }
  throw lastError;
}
