export { useCalendarStore, type UseCalendarStoreReturn } from './hooks/useCalendarStore.js';
export { useViewBuilder } from './hooks/useViewBuilder.js';
export { useCalendar, type UseCalendarOptions } from './hooks/useCalendar.js';

export {
  createCalendarStore,
  createViewBuilder,
  createTimeSlotDayGenerator,
  withToday,
  withOutsideFlag,
  withSelection,
  withEvents,
  withWeekNumbers,
  withWeekend,
  withFixedWeeks,
  withDisabled,
  withCustom,
} from '@calendar/core';

export type {
  BaseCell,
  CalendarEvent,
  CalendarEventInput,
  CalendarState,
  CalendarStore,
  CalendarStoreOptions,
  NavigationStrategy,
  BuildContext,
  PipeFn,
  TimeSlotDayOptions,
  ViewBuilder,
  ViewBuilderOptions,
  ViewGenerator,
  ViewType,
} from '@calendar/core';
