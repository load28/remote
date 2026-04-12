import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import type { CalendarState, CalendarStore } from '@calendar/core';
import { extractActions, type CalendarActions } from './hooks/useCalendarStore.js';

const StoreContext = createContext<CalendarStore | null>(null);

interface CalendarProviderProps {
  store: CalendarStore;
  children: ReactNode;
}

export function CalendarProvider({ store, children }: CalendarProviderProps) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useCalendarStoreContext(): CalendarStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useCalendarStoreContext must be used within a CalendarProvider');
  }
  return store;
}

export function useCalendarState(): CalendarState {
  const store = useCalendarStoreContext();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

export function useCalendarActions(): CalendarActions {
  const store = useCalendarStoreContext();
  return useMemo(() => extractActions(store), [store]);
}
