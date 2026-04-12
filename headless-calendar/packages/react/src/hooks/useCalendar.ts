import { useMemo } from 'react';
import {
  createViewBuilder,
  type CalendarStoreOptions,
  type ViewBuilderOptions,
  type BaseCell,
  type ViewBuilder,
} from '@calendar/core';
import { useCalendarStore } from './useCalendarStore.js';
import { useViewBuilder } from './useViewBuilder.js';

export interface UseCalendarOptions extends CalendarStoreOptions {
  viewBuilderOptions?: ViewBuilderOptions;
}

export function useCalendar<TCell extends BaseCell = BaseCell>(
  options: UseCalendarOptions = {},
  configurePipes?: (builder: ViewBuilder<BaseCell>) => ViewBuilder<TCell>,
) {
  const { viewBuilderOptions, ...storeOptions } = options;
  const { state, store, ...actions } = useCalendarStore(storeOptions);

  // Serialize to a stable primitive so inline `{ weekStartsOn, fixedWeeks }`
  // objects don't cause a rebuild every render.  Forward-compatible with any
  // future ViewBuilderOptions fields without manual extraction.
  const builderDeps = JSON.stringify(viewBuilderOptions ?? {});

  const builder = useMemo(() => {
    const base = createViewBuilder(viewBuilderOptions);
    return configurePipes ? configurePipes(base) : base as unknown as ViewBuilder<TCell>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builderDeps, configurePipes]);

  const grid = useViewBuilder(builder, state);

  return {
    state,
    store,
    grid,
    ...actions,
  };
}
