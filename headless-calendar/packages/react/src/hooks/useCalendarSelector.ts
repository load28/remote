import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { CalendarState } from '@calendar/core';
import { useCalendarStoreContext } from '../CalendarProvider.js';

/**
 * Shallow-compare two values by top-level keys.
 *
 * @example
 * const { cursor, view } = useCalendarSelector(
 *   s => ({ cursor: s.cursor, view: s.view }),
 *   shallowEqual,
 * );
 */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }
  return true;
}

/**
 * Subscribe to a specific slice of CalendarState via a selector.
 *
 * By default values are compared with `Object.is`. Pass `shallowEqual`
 * (or a custom comparator) as the second argument when the selector
 * returns a derived object.
 *
 * @example
 * // primitive — Object.is is sufficient
 * const cursor = useCalendarSelector(s => s.cursor);
 *
 * // derived object — use shallowEqual to avoid extra re-renders
 * const { cursor, view } = useCalendarSelector(
 *   s => ({ cursor: s.cursor, view: s.view }),
 *   shallowEqual,
 * );
 */
export function useCalendarSelector<T>(
  selector: (state: CalendarState) => T,
  isEqual?: (a: T, b: T) => boolean,
): T {
  const store = useCalendarStoreContext();

  const selectorRef = useRef(selector);
  const isEqualRef = useRef(isEqual);
  const resultRef = useRef<{ value: T } | null>(null);

  selectorRef.current = selector;
  isEqualRef.current = isEqual;

  const getSnapshot = useCallback(() => {
    const next = selectorRef.current(store.getState());

    if (resultRef.current !== null) {
      const eq = isEqualRef.current ?? Object.is;
      if (eq(resultRef.current.value, next)) {
        return resultRef.current.value;
      }
    }

    resultRef.current = { value: next };
    return next;
  }, [store]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
