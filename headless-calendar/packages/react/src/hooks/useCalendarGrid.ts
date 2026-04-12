import { useMemo } from 'react';
import type { BaseCell, ViewBuilder } from '@calendar/core';
import { useCalendarState } from '../CalendarProvider.js';

/**
 * Build a memoized grid from a ViewBuilder using state from CalendarProvider.
 *
 * Same logic as `useViewBuilder` but reads cursor/view from context,
 * so the builder doesn't need to be wired to state manually.
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
  const state = useCalendarState();

  return useMemo(
    () => builder.build(state.cursor, state.view),
    [builder, state],
  );
}
