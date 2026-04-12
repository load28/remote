import { useMemo, useSyncExternalStore } from 'react';
import {
  createCalendarStore,
  type CalendarStoreOptions,
  type CalendarState,
  type CalendarStore,
} from '@calendar/core';

export interface CalendarActions {
  next: () => void;
  prev: () => void;
  today: () => void;
  setCursor: CalendarStore['setCursor'];
  setView: CalendarStore['setView'];
  select: CalendarStore['select'];
  selectRange: CalendarStore['selectRange'];
  toggleSelect: CalendarStore['toggleSelect'];
  clearSelection: () => void;
  addEvent: CalendarStore['addEvent'];
  removeEvent: CalendarStore['removeEvent'];
  updateEvent: CalendarStore['updateEvent'];
}

export interface UseCalendarStoreReturn extends CalendarActions {
  state: CalendarState;
  store: CalendarStore;
}

export function extractActions(store: CalendarStore): CalendarActions {
  return {
    next: store.next,
    prev: store.prev,
    today: store.today,
    setCursor: store.setCursor,
    setView: store.setView,
    select: store.select,
    selectRange: store.selectRange,
    toggleSelect: store.toggleSelect,
    clearSelection: store.clearSelection,
    addEvent: store.addEvent,
    removeEvent: store.removeEvent,
    updateEvent: store.updateEvent,
  };
}

export function useCalendarStore(options: CalendarStoreOptions = {}): UseCalendarStoreReturn {
  const store = useMemo(() => createCalendarStore(options), []);

  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  );

  const actions = useMemo(() => extractActions(store), [store]);

  return useMemo(() => ({ state, store, ...actions }), [state, store, actions]);
}
