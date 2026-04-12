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
 * 1. If `state.events` reference hasn't changed, the previous result is
 *    returned immediately (fast path — skips the filter entirely).
 * 2. If events did change, the filtered result is compared element-wise
 *    so unrelated event mutations don't trigger a re-render.
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

  const prevEventsRef = useRef<CalendarEvent[]>([]);
  const resultRef = useRef<CalendarEvent[]>([]);

  const getSnapshot = useCallback(() => {
    const currentEvents = store.getState().events;

    // Fast path: events array unchanged → filtered result unchanged
    if (currentEvents === prevEventsRef.current) {
      return resultRef.current;
    }
    prevEventsRef.current = currentEvents;

    const next = endMs !== undefined
      ? store.getEventsForRange(new Date(startMs), new Date(endMs))
      : store.getEventsForDate(new Date(startMs));

    // Return stable reference if filtered contents are identical
    if (
      next.length === resultRef.current.length
      && next.every((e: CalendarEvent, i: number) => e === resultRef.current[i])
    ) {
      return resultRef.current;
    }

    resultRef.current = next;
    return next;
  }, [store, startMs, endMs]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
