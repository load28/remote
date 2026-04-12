import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { CalendarEvent } from '@calendar/core';
import { useCalendarStoreContext } from '../CalendarProvider.js';

/**
 * Retrieve events for a single date or a date range from CalendarProvider.
 *
 * Uses a single `useSyncExternalStore` subscription with a smart snapshot
 * that filters events for the requested date(s) and caches the result.
 *
 * Two levels of caching avoid unnecessary work:
 * 1. If `state.events` reference AND date parameters are both unchanged,
 *    the previous result is returned immediately (fast path).
 * 2. If events or date params changed, the filtered result is compared
 *    element-wise so unrelated mutations don't trigger a re-render.
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

  const startMs = dateOrStart.getTime();
  const endMs = end?.getTime();

  const cacheRef = useRef<{
    eventsRef: CalendarEvent[];
    startMs: number;
    endMs: number | undefined;
    result: CalendarEvent[];
  }>({ eventsRef: [], startMs: 0, endMs: undefined, result: [] });

  const getSnapshot = useCallback(() => {
    const currentEvents = store.getState().events;
    const c = cacheRef.current;

    // Fast path: both events array AND date params unchanged
    if (currentEvents === c.eventsRef && startMs === c.startMs && endMs === c.endMs) {
      return c.result;
    }

    const next = endMs !== undefined
      ? store.getEventsForRange(new Date(startMs), new Date(endMs))
      : store.getEventsForDate(new Date(startMs));

    // Return stable reference if filtered contents are identical
    if (
      next.length === c.result.length
      && next.every((e: CalendarEvent, i: number) => e === c.result[i])
    ) {
      cacheRef.current = { eventsRef: currentEvents, startMs, endMs, result: c.result };
      return c.result;
    }

    cacheRef.current = { eventsRef: currentEvents, startMs, endMs, result: next };
    return next;
  }, [store, startMs, endMs]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
