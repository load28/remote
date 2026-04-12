import { useCallback, useMemo, useRef } from 'react';
import type { BaseCell } from '@calendar/core';
import { useCalendarActions } from '../CalendarProvider.js';

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

const NAV_LABELS: Record<string, string> = { prev: 'Previous', next: 'Next', today: 'Today' };

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

  const onCellClickRef = useRef(onCellClick);
  onCellClickRef.current = onCellClick;

  const cellHandler = useCallback((date: Date) => {
    const mode = onCellClickRef.current;
    if (typeof mode === 'function') return mode(date);
    if (mode === 'toggleSelect') return actions.toggleSelect(date);
    actions.select(date);
  }, [actions]);

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
