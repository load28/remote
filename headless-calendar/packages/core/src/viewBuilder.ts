import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  addDays,
  eachDayOfInterval,
} from 'date-fns';
import type {
  BaseCell,
  BuildContext,
  ViewBuilder,
  ViewBuilderOptions,
  ViewGenerator,
  ViewType,
} from './types.js';

function generateMonthCells(cursor: Date, options: ViewBuilderOptions): BaseCell[][] {
  const { weekStartsOn = 0, fixedWeeks } = options;
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const cells: BaseCell[] = days.map((date) => ({ date }));

  const rows: BaseCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  if (fixedWeeks && rows.length < fixedWeeks) {
    while (rows.length < fixedWeeks) {
      const lastRow = rows[rows.length - 1];
      const lastDate = lastRow[lastRow.length - 1].date;
      rows.push(
        Array.from({ length: 7 }, (_, i) => ({ date: addDays(lastDate, i + 1) })),
      );
    }
  }

  return fixedWeeks ? rows.slice(0, fixedWeeks) : rows;
}

function generateWeekCells(cursor: Date, options: ViewBuilderOptions): BaseCell[][] {
  const { weekStartsOn = 0 } = options;
  const weekStart = startOfWeek(cursor, { weekStartsOn });
  const weekEnd = endOfWeek(cursor, { weekStartsOn });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  return [days.map((date) => ({ date }))];
}

function generateDayCells(cursor: Date, _options: ViewBuilderOptions): BaseCell[][] {
  return [[{ date: startOfDay(cursor) }]];
}

const DEFAULT_GENERATORS: Record<string, ViewGenerator> = {
  month: generateMonthCells,
  week: generateWeekCells,
  day: generateDayCells,
};

type AnyPipeFn = (cells: any[][], context: BuildContext) => any[][];

/**
 * Internal factory that carries accumulated pipes and generators.
 *
 * Every `pipe()` and `register()` call returns a **new** builder instance so
 * the original is never mutated.  This prevents the shared-builder aliasing
 * bug where forking a base builder silently appends pipes to both forks.
 */
function _createBuilder<TCell extends BaseCell>(
  options: ViewBuilderOptions,
  pipes: AnyPipeFn[],
  generators: Record<string, ViewGenerator>,
): ViewBuilder<TCell> {
  return {
    pipe<TExtra = {}>(
      fn: (cells: TCell[][], context: BuildContext) => (TCell & TExtra)[][],
    ): ViewBuilder<TCell & TExtra> {
      return _createBuilder<TCell & TExtra>(
        options,
        [...pipes, fn as AnyPipeFn],
        generators,
      );
    },

    register(viewName: string, generator: ViewGenerator): ViewBuilder<TCell> {
      return _createBuilder<TCell>(
        options,
        pipes,
        { ...generators, [viewName]: generator },
      );
    },

    build(cursor: Date, view: ViewType = 'month') {
      const generator = generators[view];
      if (!generator) {
        throw new Error(`Unknown view: "${view}". Register it with builder.register().`);
      }

      const context: BuildContext = { cursor, view, options };
      let cells: any[][] = generator(cursor, options);
      const meta = (cells as any).meta;

      for (const pipe of pipes) {
        cells = pipe(cells, context);
      }

      if (meta) (cells as any).meta = meta;

      return cells as TCell[][] & { meta?: Record<string, unknown> };
    },
  };
}

export function createViewBuilder<TCell extends BaseCell = BaseCell>(
  options: ViewBuilderOptions = {},
): ViewBuilder<TCell> {
  return _createBuilder<TCell>(options, [], { ...DEFAULT_GENERATORS });
}
