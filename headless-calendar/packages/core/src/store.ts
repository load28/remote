import { addMonths, addWeeks, addDays, startOfDay, isSameDay } from 'date-fns';
import type {
  CalendarStore,
  CalendarStoreOptions,
  CalendarState,
  CalendarEvent,
  CalendarEventInput,
  NavigationStrategy,
} from './types.js';

const DEFAULT_NAVIGATION: Record<string, NavigationStrategy> = {
  month: { next: (d) => addMonths(d, 1), prev: (d) => addMonths(d, -1) },
  week: { next: (d) => addWeeks(d, 1), prev: (d) => addWeeks(d, -1) },
  day: { next: (d) => addDays(d, 1), prev: (d) => addDays(d, -1) },
};

export function createCalendarStore(options: CalendarStoreOptions = {}): CalendarStore {
  const navigation: Record<string, NavigationStrategy> = {
    ...DEFAULT_NAVIGATION,
    ...options.navigation,
  };

  let state: CalendarState = {
    cursor: startOfDay(options.defaultDate ?? new Date()),
    view: options.defaultView ?? 'month',
    selected: [],
    events: [],
  };

  const listeners = new Set<(state: CalendarState) => void>();

  function notify(): void {
    const snapshot = { ...state };
    listeners.forEach((fn) => fn(snapshot));
  }

  function setState(updater: Partial<CalendarState> | ((prev: CalendarState) => CalendarState)): void {
    state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
    notify();
  }

  return {
    getState() {
      return { ...state };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },

    next() {
      const nav = navigation[state.view];
      if (nav) setState({ cursor: nav.next(state.cursor) });
    },

    prev() {
      const nav = navigation[state.view];
      if (nav) setState({ cursor: nav.prev(state.cursor) });
    },

    today() {
      setState({ cursor: startOfDay(new Date()) });
    },

    setCursor(date) {
      setState({ cursor: startOfDay(date) });
    },

    setView(view) {
      setState({ view });
    },

    select(date) {
      setState({ selected: [startOfDay(date)] });
    },

    selectRange(start, end) {
      const s = startOfDay(start);
      const e = startOfDay(end);
      const range: Date[] = [];
      let current = s <= e ? s : e;
      const last = s <= e ? e : s;
      while (current <= last) {
        range.push(current);
        current = addDays(current, 1);
      }
      setState({ selected: range });
    },

    toggleSelect(date) {
      const target = startOfDay(date);
      setState((prev) => {
        const exists = prev.selected.some((d) => isSameDay(d, target));
        return {
          ...prev,
          selected: exists
            ? prev.selected.filter((d) => !isSameDay(d, target))
            : [...prev.selected, target],
        };
      });
    },

    clearSelection() {
      setState({ selected: [] });
    },

    isSelected(date) {
      return state.selected.some((d) => isSameDay(d, startOfDay(date)));
    },

    addEvent(event: CalendarEventInput) {
      const id = event.id ?? crypto.randomUUID();
      const newEvent: CalendarEvent = { ...event, id };
      setState((prev) => ({
        ...prev,
        events: [...prev.events, newEvent],
      }));
    },

    removeEvent(id) {
      setState((prev) => ({
        ...prev,
        events: prev.events.filter((e) => e.id !== id),
      }));
    },

    updateEvent(id, patch) {
      setState((prev) => ({
        ...prev,
        events: prev.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
    },

    getEventsForDate(date) {
      const target = startOfDay(date);
      return state.events.filter((e) => {
        const start = startOfDay(e.start);
        const end = e.end ? startOfDay(e.end) : start;
        return target >= start && target <= end;
      });
    },

    getEventsForRange(start, end) {
      const s = startOfDay(start);
      const e = startOfDay(end);
      return state.events.filter((ev) => {
        const evStart = startOfDay(ev.start);
        const evEnd = ev.end ? startOfDay(ev.end) : evStart;
        return evStart <= e && evEnd >= s;
      });
    },
  };
}
