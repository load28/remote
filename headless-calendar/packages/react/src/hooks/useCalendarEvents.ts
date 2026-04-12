import { useMemo } from 'react';
import type { CalendarEvent } from '@calendar/core';
import { useCalendarStoreContext } from '../CalendarProvider.js';
import { useCalendarSelector } from './useCalendarSelector.js';

/**
 * Retrieve events for a single date or a date range from CalendarProvider.
 *
 * Re-renders only when the events array reference changes.
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
  const events = useCalendarSelector((s) => s.events);

  const startMs = dateOrStart.getTime();
  const endMs = end?.getTime();

  return useMemo(() => {
    if (endMs !== undefined) {
      return store.getEventsForRange(new Date(startMs), new Date(endMs));
    }
    return store.getEventsForDate(new Date(startMs));
  }, [store, events, startMs, endMs]);
}
