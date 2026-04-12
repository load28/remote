import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { CalendarState, CalendarStore } from '@calendar/core';
import { extractActions, type CalendarActions } from './hooks/useCalendarStore.js';

const StoreContext = createContext<CalendarStore | null>(null);
const ActionsContext = createContext<CalendarActions | null>(null);
const StateContext = createContext<CalendarState | null>(null);

interface CalendarProviderProps {
  store: CalendarStore;
  children: ReactNode;
}

export function CalendarProvider({ store, children }: CalendarProviderProps) {
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const actions = useMemo(() => extractActions(store), [store]);

  return (
    <StoreContext.Provider value={store}>
      <ActionsContext.Provider value={actions}>
        <StateContext.Provider value={state}>
          {children}
        </StateContext.Provider>
      </ActionsContext.Provider>
    </StoreContext.Provider>
  );
}

export function useCalendarStoreContext(): CalendarStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useCalendarStoreContext must be used within a CalendarProvider');
  }
  return store;
}

export function useCalendarState(): CalendarState {
  const state = useContext(StateContext);
  if (state === null) {
    throw new Error('useCalendarState must be used within a CalendarProvider');
  }
  return state;
}

export function useCalendarActions(): CalendarActions {
  const actions = useContext(ActionsContext);
  if (!actions) {
    throw new Error('useCalendarActions must be used within a CalendarProvider');
  }
  return actions;
}
