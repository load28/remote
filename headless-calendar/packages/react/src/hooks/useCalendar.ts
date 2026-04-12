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

  const weekStartsOn = viewBuilderOptions?.weekStartsOn;
  const fixedWeeks = viewBuilderOptions?.fixedWeeks;

  const builder = useMemo(() => {
    const base = createViewBuilder({ weekStartsOn, fixedWeeks });
    return configurePipes ? configurePipes(base) : base as unknown as ViewBuilder<TCell>;
  }, [weekStartsOn, fixedWeeks, configurePipes]);

  const grid = useViewBuilder(builder, state);

  return {
    state,
    store,
    grid,
    ...actions,
  };
}
