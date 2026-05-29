import React, { createContext, useContext, useSyncExternalStore } from 'react';
import type { Store } from './store.js';
import { createStore } from './store.js';
import type { AppState } from './AppStateStore.js';
import { INITIAL_APP_STATE } from './AppStateStore.js';

const AppStateContext = createContext<Store<AppState> | null>(null);

export function AppStateProvider({ children, initialState }: {
  children: React.ReactNode;
  initialState?: Partial<AppState>;
}) {
  const storeRef = React.useRef<Store<AppState> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createStore({ ...INITIAL_APP_STATE, ...initialState });
  }

  return (
    <AppStateContext.Provider value={storeRef.current}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState<T>(selector: (state: AppState) => T): T {
  const store = useContext(AppStateContext);
  if (!store) throw new Error('useAppState must be used within AppStateProvider');
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
  );
}

export function useAppStateStore(): Store<AppState> {
  const store = useContext(AppStateContext);
  if (!store) throw new Error('useAppStateStore must be used within AppStateProvider');
  return store;
}
