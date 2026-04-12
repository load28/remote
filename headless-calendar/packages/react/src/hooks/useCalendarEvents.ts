import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import type { CalendarEvent, CalendarStore } from '@calendar/core';
import { useCalendarStoreContext } from '../CalendarProvider.js';

/**
 * Retrieve events for a single date or a date range from CalendarProvider.
 *
 * Subscribes directly to the store's events slice so the store context
 * is resolved once (not twice via a separate useCalendarSelector call).
 *
 * @example
 * // single date
 * const events = useCalendarEvents(selectedDate);
 *
 * // date range
 * const events = useCalendarEvents(weekStart, weekEnd);
 */
export function useCalendarEvents(date: Date): CalendarEvent[];
export function useCalendarEvents(start: Date, end: Date): CalendarEvent[];
export function useCalendarEvents(dateOrStart: Date, end?: Date): CalendarEvent[] {
  const store = useCalendarStoreContext();

  const eventsSelector = useCallback(
    () => store.getState().events,
    [store],
  );
  const events = useSyncExternalStore(store.subscribe, eventsSelector, eventsSelector);

  const startMs = dateOrStart.getTime();
  const endMs = end?.getTime();

  return useMemo(() => {
    if (endMs !== undefined) {
      return store.getEventsForRange(new Date(startMs), new Date(endMs));
    }
    return store.getEventsForDate(new Date(startMs));
  }, [store, events, startMs, endMs]);
}
