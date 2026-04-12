import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { CalendarState } from '@calendar/core';
import { useCalendarStoreContext } from '../CalendarProvider.js';

/**
 * Subscribe to a specific slice of CalendarState via a selector.
 *
 * Re-renders only when the selected value changes (compared with `Object.is`).
 * For primitive selectors (e.g. `s => s.cursor`) this avoids unnecessary
 * re-renders when unrelated parts of the state change.
 *
 * @example
 * const cursor = useCalendarSelector(s => s.cursor);
 * const view = useCalendarSelector(s => s.view);
 */
export function useCalendarSelector<T>(selector: (state: CalendarState) => T): T {
  const store = useCalendarStoreContext();
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const getSnapshot = useCallback(
    () => selectorRef.current(store.getState()),
    [store],
  );

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
