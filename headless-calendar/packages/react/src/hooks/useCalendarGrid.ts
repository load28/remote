import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { BaseCell, CalendarEvent, ViewBuilder, ViewType } from '@calendar/core';
import { useCalendarStoreContext } from '../CalendarProvider.js';

/**
 * Build a memoized grid from a ViewBuilder using state from CalendarProvider.
 *
 * Unlike the simpler `useViewBuilder` (which receives state as a prop and
 * relies on the parent to re-render), this hook subscribes to the store
 * directly and returns a **stable grid reference**.  The consuming component
 * only re-renders when the built grid actually changes.
 *
 * Internally, the snapshot function tracks individual state fields
 * (cursor, view, selected, events) so the grid skips rebuilds when
 * unrelated fields change.
 *
 * @example
 * function MonthView({ builder }: { builder: ViewBuilder<MyCell> }) {
 *   const grid = useCalendarGrid(builder);
 *   return grid.map(row => ...);
 * }
 */
export function useCalendarGrid<TCell extends BaseCell>(
  builder: ViewBuilder<TCell>,
): TCell[][] & { meta?: Record<string, unknown> } {
  const store = useCalendarStoreContext();

  const builderRef = useRef(builder);
  builderRef.current = builder;

  const cacheRef = useRef<{
    builder: ViewBuilder<TCell>;
    cursorMs: number;
    view: ViewType;
    selected: Date[];
    events: CalendarEvent[];
    grid: TCell[][] & { meta?: Record<string, unknown> };
  } | null>(null);

  const getSnapshot = useCallback((): TCell[][] & { meta?: Record<string, unknown> } => {
    const { cursor, view, selected, events } = store.getState();
    const cursorMs = cursor.getTime();
    const currentBuilder = builderRef.current;

    const c = cacheRef.current;
    if (
      c &&
      c.builder === currentBuilder &&
      c.cursorMs === cursorMs &&
      c.view === view &&
      c.selected === selected &&
      c.events === events
    ) {
      return c.grid;
    }

    const grid = currentBuilder.build(cursor, view);
    cacheRef.current = { builder: currentBuilder, cursorMs, view, selected, events, grid };
    return grid;
  }, [store]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
