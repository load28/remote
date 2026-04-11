import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
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
  const { weekStartsOn = 0 } = options;
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
  return rows;
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

export function createViewBuilder<TCell extends BaseCell = BaseCell>(
  options: ViewBuilderOptions = {},
): ViewBuilder<TCell> {
  type AnyPipeFn = (cells: any[][], context: BuildContext) => any[][];

  const pipes: AnyPipeFn[] = [];
  const generators: Record<string, ViewGenerator> = { ...DEFAULT_GENERATORS };

  const builder: ViewBuilder<TCell> = {
    pipe<TExtra = {}>(
      fn: (cells: TCell[][], context: BuildContext) => (TCell & TExtra)[][],
    ): ViewBuilder<TCell & TExtra> {
      pipes.push(fn as AnyPipeFn);
      return builder as unknown as ViewBuilder<TCell & TExtra>;
    },

    register(viewName: string, generator: ViewGenerator): ViewBuilder<TCell> {
      generators[viewName] = generator;
      return builder;
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

  return builder;
}
