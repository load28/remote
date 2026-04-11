import { useMemo } from 'react';
import type { BaseCell, CalendarState, ViewBuilder } from '@calendar/core';

/**
 * Builds a memoized grid from a ViewBuilder.
 *
 * Memoization key is the entire CalendarState reference: the store reassigns
 * `state` on every change, so the grid is rebuilt whenever cursor, view,
 * selection, or events change. This is necessary for state-bound pipes
 * (withEvents, withSelection) to reflect the latest store state.
 */
export function useViewBuilder<TCell extends BaseCell>(
  builder: ViewBuilder<TCell>,
  state: CalendarState,
): TCell[][] & { meta?: Record<string, unknown> } {
  return useMemo(
    () => builder.build(state.cursor, state.view),
    [builder, state],
  );
}
