import { describe, it, expect } from 'vitest';
import { createStore } from '../../src/state/store.js';

describe('createStore', () => {
  it('should initialize with provided state', () => {
    const store = createStore({ count: 0 });
    expect(store.getState()).toEqual({ count: 0 });
  });

  it('should update state via setState', () => {
    const store = createStore({ count: 0 });
    store.setState({ count: 1 });
    expect(store.getState().count).toBe(1);
  });

  it('should notify subscribers on state change', () => {
    const store = createStore({ count: 0 });
    let notified = 0;
    const unsub = store.subscribe(() => { notified++; });
    store.setState({ count: 1 });
    expect(notified).toBe(1);
    unsub();
  });

  it('should not notify after unsubscribe', () => {
    const store = createStore({ count: 0 });
    let notified = 0;
    const unsub = store.subscribe(() => { notified++; });
    store.setState({ count: 1 });
    unsub();
    store.setState({ count: 2 });
    expect(notified).toBe(1);
  });

  it('should merge state with partial update', () => {
    const store = createStore({ a: 1, b: 'hello' });
    store.setState({ b: 'world' });
    expect(store.getState()).toEqual({ a: 1, b: 'world' });
  });
});
