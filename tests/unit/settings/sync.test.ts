import { describe, it, expect } from 'vitest';
import { mergeSettings } from '../../../src/utils/settings/sync.js';
import type { SettingsLayer } from '../../../src/utils/settings/sync.js';

describe('mergeSettings', () => {
  it('returns empty object for empty layers', () => {
    expect(mergeSettings([])).toEqual({});
  });

  it('merges a single layer', () => {
    const layers: SettingsLayer[] = [{ source: 'user', settings: { theme: 'dark' } }];
    expect(mergeSettings(layers)).toEqual({ theme: 'dark' });
  });

  it('user overrides project', () => {
    const layers: SettingsLayer[] = [
      { source: 'project', settings: { theme: 'light', fontSize: 12 } },
      { source: 'user', settings: { theme: 'dark' } },
    ];
    expect(mergeSettings(layers)).toEqual({ theme: 'dark', fontSize: 12 });
  });

  it('project overrides local, managed, flag', () => {
    const layers: SettingsLayer[] = [
      { source: 'flag', settings: { beta: true } },
      { source: 'managed', settings: { beta: false, locked: true } },
      { source: 'local', settings: { beta: false } },
      { source: 'project', settings: { beta: true } },
    ];
    expect(mergeSettings(layers)).toEqual({ beta: true, locked: true });
  });

  it('full priority chain: user > project > local > managed > flag', () => {
    const layers: SettingsLayer[] = [
      { source: 'flag', settings: { a: 1, b: 1, c: 1, d: 1, e: 1 } },
      { source: 'managed', settings: { a: 2, b: 2, c: 2, d: 2 } },
      { source: 'local', settings: { a: 3, b: 3, c: 3 } },
      { source: 'project', settings: { a: 4, b: 4 } },
      { source: 'user', settings: { a: 5 } },
    ];
    expect(mergeSettings(layers)).toEqual({ a: 5, b: 4, c: 3, d: 2, e: 1 });
  });

  it('handles missing layers gracefully', () => {
    const layers: SettingsLayer[] = [
      { source: 'flag', settings: { only: 'flag' } },
    ];
    expect(mergeSettings(layers)).toEqual({ only: 'flag' });
  });
});
