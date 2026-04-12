import { addMonths, addWeeks, addDays, startOfDay } from 'date-fns';
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

const EMPTY_EVENTS: CalendarEvent[] = [];

export function createCalendarStore(options: CalendarStoreOptions = {}): CalendarStore {
  const navigation: Record<string, NavigationStrategy> = {
    ...DEFAULT_NAVIGATION,
    ...options.navigation,
  };

  const initialEvents: CalendarEvent[] = (options.defaultEvents ?? []).map((e) => ({
    ...e,
    id: e.id ?? crypto.randomUUID(),
  }));

  let state: CalendarState = {
    cursor: startOfDay(options.defaultDate ?? new Date()),
    view: options.defaultView ?? 'month',
    selected: [],
    events: initialEvents,
  };

  const listeners = new Set<(state: CalendarState) => void>();

  // --- batching ---
  let batching = false;
  let batchDirty = false;

  function notify(): void {
    if (batching) {
      batchDirty = true;
      return;
    }
    listeners.forEach((fn) => fn(state));
  }

  function setState(updater: Partial<CalendarState> | ((prev: CalendarState) => CalendarState)): void {
    const prev = state;
    const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };

    // Skip notification when no field reference actually changed.
    // cursor is compared by value (getTime) because navigation helpers
    // always produce a new Date object even for the same calendar day.
    if (
      prev.cursor.getTime() === next.cursor.getTime() &&
      prev.view === next.view &&
      prev.selected === next.selected &&
      prev.events === next.events
    ) {
      return;
    }

    state = next;
    notify();
  }

  // --- lazy caches (invalidated by reference check) ---

  let selectedSetCache: { ref: Date[]; set: Set<number> } | null = null;

  function getSelectedSet(): Set<number> {
    if (selectedSetCache && selectedSetCache.ref === state.selected) {
      return selectedSetCache.set;
    }
    const set = new Set(state.selected.map((d) => d.getTime()));
    selectedSetCache = { ref: state.selected, set };
    return set;
  }

  let eventIndexCache: { ref: CalendarEvent[]; map: Map<number, CalendarEvent[]> } | null = null;

  function buildEventIndex(): Map<number, CalendarEvent[]> {
    if (eventIndexCache && eventIndexCache.ref === state.events) {
      return eventIndexCache.map;
    }

    const map = new Map<number, CalendarEvent[]>();
    for (const ev of state.events) {
      const evStart = startOfDay(ev.start);
      const evEnd = ev.end ? startOfDay(ev.end) : evStart;
      let current = evStart;
      while (current <= evEnd) {
        const key = current.getTime();
        let bucket = map.get(key);
        if (!bucket) {
          bucket = [];
          map.set(key, bucket);
        }
        bucket.push(ev);
        current = addDays(current, 1);
      }
    }

    eventIndexCache = { ref: state.events, map };
    return map;
  }

  return {
    getState() {
      return state;
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
      const from = s <= e ? s : e;
      const to = s <= e ? e : s;
      const range: Date[] = [];
      let current = from;
      while (current <= to) {
        range.push(current);
        current = addDays(current, 1);
      }
      setState({ selected: range });
    },

    toggleSelect(date) {
      const target = startOfDay(date);
      const targetMs = target.getTime();
      setState((prev) => {
        const exists = prev.selected.some((d) => d.getTime() === targetMs);
        return {
          ...prev,
          selected: exists
            ? prev.selected.filter((d) => d.getTime() !== targetMs)
            : [...prev.selected, target],
        };
      });
    },

    clearSelection() {
      if (state.selected.length === 0) return;
      setState({ selected: [] });
    },

    isSelected(date) {
      return getSelectedSet().has(startOfDay(date).getTime());
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
      setState((prev) => {
        const events = prev.events.filter((e) => e.id !== id);
        if (events.length === prev.events.length) return prev;
        return { ...prev, events };
      });
    },

    updateEvent(id, patch) {
      setState((prev) => {
        const idx = prev.events.findIndex((e) => e.id === id);
        if (idx === -1) return prev;
        const events = prev.events.map((e, i) => (i === idx ? { ...e, ...patch } : e));
        return { ...prev, events };
      });
    },

    getEventsForDate(date) {
      const target = startOfDay(date);
      return buildEventIndex().get(target.getTime()) ?? EMPTY_EVENTS;
    },

    getEventsForRange(start, end) {
      const s = startOfDay(start);
      const e = startOfDay(end);
      const from = s <= e ? s : e;
      const to = s <= e ? e : s;
      const index = buildEventIndex();
      const seen = new Set<string>();
      const result: CalendarEvent[] = [];
      let current = from;
      while (current <= to) {
        const bucket = index.get(current.getTime());
        if (bucket) {
          for (const ev of bucket) {
            if (!seen.has(ev.id)) {
              seen.add(ev.id);
              result.push(ev);
            }
          }
        }
        current = addDays(current, 1);
      }
      return result;
    },

    batch(fn) {
      batching = true;
      batchDirty = false;
      try {
        fn();
      } finally {
        batching = false;
        if (batchDirty) {
          batchDirty = false;
          listeners.forEach((l) => l(state));
        }
      }
    },
  };
}
