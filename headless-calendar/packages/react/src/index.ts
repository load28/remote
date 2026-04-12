export {
  useCalendarStore,
  extractActions,
  type CalendarActions,
  type UseCalendarStoreReturn,
} from './hooks/useCalendarStore.js';
export { useViewBuilder } from './hooks/useViewBuilder.js';
export { useCalendar, type UseCalendarOptions } from './hooks/useCalendar.js';
export { useCalendarSelector } from './hooks/useCalendarSelector.js';
export { useCalendarEvents } from './hooks/useCalendarEvents.js';
export {
  CalendarProvider,
  useCalendarStoreContext,
  useCalendarState,
  useCalendarActions,
} from './CalendarProvider.js';

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
