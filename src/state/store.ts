type Listener = () => void;

export interface Store<T> {
  getState(): T;
  setState(partial: Partial<T>): void;
  subscribe(listener: Listener): () => void;
}

export function createStore<T extends Record<string, unknown>>(initialState: T): Store<T> {
  let state = { ...initialState };
  const listeners = new Set<Listener>();

  return {
    getState() {
      return state;
    },
    setState(partial) {
      state = { ...state, ...partial };
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
