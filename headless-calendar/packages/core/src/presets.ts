import { isToday, isSameMonth, isSameDay, getWeek, isWeekend, addDays } from 'date-fns';
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
  return (cells: TCell[][], _context: BuildContext): (TCell & { weekNumber: number })[][] =>
    cells.map((row) => {
      const weekNumber = getWeek(row[0].date);
      return row.map((cell) => ({ ...cell, weekNumber }));
    });
}

export function withWeekend<TCell extends BaseCell>() {
  return (cells: TCell[][], _context: BuildContext): (TCell & { weekend: boolean })[][] =>
    cells.map((row) =>
      row.map((cell) => ({ ...cell, weekend: isWeekend(cell.date) })),
    );
}

export function withFixedWeeks<TCell extends BaseCell>(totalWeeks: number = 6) {
  return (cells: TCell[][], _context: BuildContext): TCell[][] => {
    const result = [...cells];
    while (result.length < totalWeeks) {
      const lastRow = result[result.length - 1];
      const lastDate = lastRow[lastRow.length - 1].date;
      const newRow: TCell[] = [];
      for (let i = 1; i <= 7; i++) {
        newRow.push({ date: addDays(lastDate, i) } as TCell);
      }
      result.push(newRow);
    }
    return result.slice(0, totalWeeks);
  };
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
