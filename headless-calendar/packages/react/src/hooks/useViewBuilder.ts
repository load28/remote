import { useMemo } from 'react';
import type { BaseCell, ViewBuilder, ViewType } from '@calendar/core';

export function useViewBuilder<TCell extends BaseCell>(
  builder: ViewBuilder<TCell>,
  cursor: Date,
  view: ViewType = 'month',
): TCell[][] & { meta?: Record<string, unknown> } {
  return useMemo(
    () => builder.build(cursor, view),
    [builder, cursor.getTime(), view],
  );
}
