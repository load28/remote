import { isToday, isSameMonth, getWeek, isWeekend } from 'date-fns';
import type { BaseCell, BuildContext, CalendarStore, CalendarEvent } from './types.js';

export function withToday<TCell extends BaseCell>() {
  return (cells: TCell[][], _context: BuildContext): (TCell & { today: boolean })[][] =>
    cells.map((row) =>
      row.map((cell) => ({ ...cell, today: isToday(cell.date) })),
    );
}

export function withOutsideFlag<TCell extends BaseCell>() {
  return (cells: TCell[][], context: BuildContext): (TCell & { outside: boolean })[][] =>
    cells.map((row) =>
      row.map((cell) => ({
        ...cell,
        outside: !isSameMonth(cell.date, context.cursor),
      })),
    );
}

export function withSelection<TCell extends BaseCell>(store: CalendarStore) {
  return (cells: TCell[][], _context: BuildContext): (TCell & { selected: boolean })[][] =>
    cells.map((row) =>
      row.map((cell) => ({ ...cell, selected: store.isSelected(cell.date) })),
    );
}

export function withEvents<TCell extends BaseCell>(store: CalendarStore) {
  return (cells: TCell[][], _context: BuildContext): (TCell & { events: CalendarEvent[] })[][] =>
    cells.map((row) =>
      row.map((cell) => ({
        ...cell,
        events: store.getEventsForDate(cell.date),
      })),
    );
}

export function withWeekNumbers<TCell extends BaseCell>() {
  return (cells: TCell[][], context: BuildContext): (TCell & { weekNumber: number })[][] =>
    cells.map((row) => {
      const weekNumber = getWeek(row[0].date, { weekStartsOn: context.options.weekStartsOn });
      return row.map((cell) => ({ ...cell, weekNumber }));
    });
}

export function withWeekend<TCell extends BaseCell>() {
  return (cells: TCell[][], _context: BuildContext): (TCell & { weekend: boolean })[][] =>
    cells.map((row) =>
      row.map((cell) => ({ ...cell, weekend: isWeekend(cell.date) })),
    );
}

export function withDisabled<TCell extends BaseCell>(predicate: (date: Date) => boolean) {
  return (cells: TCell[][], _context: BuildContext): (TCell & { disabled: boolean })[][] =>
    cells.map((row) =>
      row.map((cell) => ({ ...cell, disabled: predicate(cell.date) })),
    );
}

export function withCustom<TCell extends BaseCell, TExtra extends Record<string, unknown>>(
  fn: (date: Date, context: BuildContext) => TExtra,
) {
  return (cells: TCell[][], context: BuildContext): (TCell & TExtra)[][] =>
    cells.map((row) =>
      row.map((cell) => ({ ...cell, ...fn(cell.date, context) })),
    );
}
