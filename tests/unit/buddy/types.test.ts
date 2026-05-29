import { describe, it, expect } from 'vitest';
import { xiaomi_cat } from '../../../src/buddy/types.js';

describe('buddy types', () => {
  it('exports xiaomi_cat constant', () => {
    expect(xiaomi_cat).toBe('xiaomi_cat');
  });
});
