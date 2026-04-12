import { useMemo } from 'react';
import type { BaseCell, CalendarState, ViewBuilder } from '@calendar/core';

/**
 * Builds a memoized grid from a ViewBuilder.
 *
 * Dependencies are individual state fields rather than the full state object.
 * The store's setState produces a new state object on every change, but only
 * the fields included in the partial update get new references.
 *
 * For example, `setState({ cursor: newDate })` keeps the same `selected` and
 * `events` references. By depending on each field individually, the grid
 * skips rebuilds when only unrelated fields change (e.g. a cursor navigation
 * won't rebuild due to events, and an event mutation won't rebuild due to
 * cursor — unless those pipes are present and their source data changed).
 */
export function useViewBuilder<TCell extends BaseCell>(
  builder: ViewBuilder<TCell>,
  state: CalendarState,
): TCell[][] & { meta?: Record<string, unknown> } {
  return useMemo(
    () => builder.build(state.cursor, state.view),
    [builder, state.cursor, state.view, state.selected, state.events],
  );
}
