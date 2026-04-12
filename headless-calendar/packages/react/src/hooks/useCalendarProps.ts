import { useCallback, useMemo } from 'react';
import type { BaseCell } from '@calendar/core';
import { useCalendarActions } from '../CalendarProvider.js';
import type { CalendarActions } from './useCalendarStore.js';

export interface CellProps {
  role: 'gridcell';
  tabIndex: number;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  onClick?: () => void;
}

export interface NavButtonProps {
  type: 'button';
  onClick: () => void;
  'aria-label': string;
}

type CellClickMode = 'select' | 'toggleSelect' | ((date: Date) => void);

export interface UseCalendarPropsOptions {
  onCellClick?: CellClickMode;
}

/**
 * Prop getters for calendar cells and navigation buttons.
 *
 * Reads actions from CalendarProvider and returns stable getter functions
 * that produce the right `role`, `aria-*`, `tabIndex`, and `onClick` props.
 *
 * @example
 * const { getCellProps, getNavProps } = useCalendarProps();
 *
 * <button {...getNavProps('prev')}>‹</button>
 * <button {...getNavProps('today')}>Today</button>
 * <button {...getNavProps('next')}>›</button>
 *
 * {grid.map(row =>
 *   row.map(cell => (
 *     <div key={cell.date.toISOString()} {...getCellProps(cell)}>
 *       {cell.date.getDate()}
 *     </div>
 *   ))
 * )}
 */
export function useCalendarProps(options: UseCalendarPropsOptions = {}) {
  const actions = useCalendarActions();
  const { onCellClick = 'select' } = options;

  const cellHandler = useMemo<(date: Date) => void>(() => {
    if (typeof onCellClick === 'function') return onCellClick;
    return onCellClick === 'toggleSelect' ? actions.toggleSelect : actions.select;
  }, [actions, onCellClick]);

  const getCellProps = useCallback(
    (cell: BaseCell & { selected?: boolean; disabled?: boolean }): CellProps => {
      const disabled = 'disabled' in cell && cell.disabled === true;
      return {
        role: 'gridcell',
        tabIndex: disabled ? -1 : 0,
        ...('selected' in cell && { 'aria-selected': cell.selected }),
        ...(disabled && { 'aria-disabled': true }),
        ...(!disabled && { onClick: () => cellHandler(cell.date) }),
      };
    },
    [cellHandler],
  );

  const navHandlers = useMemo<Record<string, () => void>>(
    () => ({ prev: actions.prev, next: actions.next, today: actions.today }),
    [actions],
  );

  const NAV_LABELS: Record<string, string> = { prev: 'Previous', next: 'Next', today: 'Today' };

  const getNavProps = useCallback(
    (direction: 'prev' | 'next' | 'today'): NavButtonProps => ({
      type: 'button',
      onClick: navHandlers[direction],
      'aria-label': NAV_LABELS[direction],
    }),
    [navHandlers],
  );

  return { getCellProps, getNavProps } as const;
}
