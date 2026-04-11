import { useMemo, useSyncExternalStore } from 'react';
import {
  createCalendarStore,
  type CalendarStoreOptions,
  type CalendarState,
  type CalendarStore,
} from '@calendar/core';

export interface UseCalendarStoreReturn {
  state: CalendarState;
  store: CalendarStore;
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

export function useCalendarStore(options: CalendarStoreOptions = {}): UseCalendarStoreReturn {
  const store = useMemo(() => createCalendarStore(options), []);

  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  );

  return useMemo(() => ({
    state,
    store,
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
  }), [state, store]);
}
