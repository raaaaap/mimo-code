import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../../../src/services/api/retry.js';
import { DEFAULT_RETRY_CONFIG } from '../../../src/types/api.js';

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, DEFAULT_RETRY_CONFIG);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('rate_limit'))
      .mockResolvedValue('ok');
    const result = await withRetry(fn, { ...DEFAULT_RETRY_CONFIG, baseDelay: 10, jitter: false });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('server_error'));
    await expect(
      withRetry(fn, { ...DEFAULT_RETRY_CONFIG, maxRetries: 2, baseDelay: 10, jitter: false })
    ).rejects.toThrow('server_error');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('invalid_request'));
    await expect(
      withRetry(fn, { ...DEFAULT_RETRY_CONFIG, retryableErrors: ['rate_limit'], baseDelay: 10 })
    ).rejects.toThrow('invalid_request');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
