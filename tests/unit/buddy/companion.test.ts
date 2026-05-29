import { describe, it, expect, beforeEach } from 'vitest';
import { getCompanion, setCompanionCache, resolveCompanion, roll, getCachedKey } from '../../../src/buddy/companion.js';

describe('companion', () => {
  beforeEach(() => {
    setCompanionCache('test', undefined);
  });

  it('roll returns xiaomi_cat bones', () => {
    expect(roll().bones.species).toBe('xiaomi_cat');
  });

  it('resolveCompanion returns companion when stored and not muted', () => {
    const result = resolveCompanion(
      { name: 'TestCat', personality: 'curious', hatchedAt: Date.now() },
      false,
    );
    expect(result).toBeDefined();
    expect(result!.species).toBe('xiaomi_cat');
    expect(result!.name).toBe('TestCat');
  });

  it('resolveCompanion returns undefined when muted', () => {
    expect(resolveCompanion({ name: 'TestCat', personality: 'curious', hatchedAt: Date.now() }, true)).toBeUndefined();
  });

  it('resolveCompanion returns undefined when no stored data', () => {
    expect(resolveCompanion(undefined, false)).toBeUndefined();
  });

  it('setCompanionCache and getCompanion work together', () => {
    expect(getCompanion()).toBeUndefined();
    const companion = resolveCompanion({ name: '猫', personality: 'lazy', hatchedAt: 1 }, false)!;
    setCompanionCache('user1', companion);
    expect(getCompanion()).toEqual(companion);
    expect(getCachedKey()).toBe('user1');
  });
});
