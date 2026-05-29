import { describe, it, expect, beforeEach } from 'vitest';
import { TelemetryCounter } from '../../../src/telemetry/counter';

describe('TelemetryCounter', () => {
  let counter: TelemetryCounter;

  beforeEach(() => {
    counter = new TelemetryCounter();
  });

  it('returns 0 for unknown names', () => {
    expect(counter.get('missing')).toBe(0);
  });

  it('increments by 1 by default', () => {
    counter.increment('hits');
    expect(counter.get('hits')).toBe(1);
  });

  it('increments by custom value', () => {
    counter.increment('bytes', 256);
    counter.increment('bytes', 128);
    expect(counter.get('bytes')).toBe(384);
  });

  it('getAll returns all counters', () => {
    counter.increment('a', 1);
    counter.increment('b', 2);
    expect(counter.getAll()).toEqual({ a: 1, b: 2 });
  });

  it('reset clears all counters', () => {
    counter.increment('x', 5);
    counter.reset();
    expect(counter.get('x')).toBe(0);
    expect(counter.getAll()).toEqual({});
  });
});
