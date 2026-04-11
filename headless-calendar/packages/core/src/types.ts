export interface BaseCell {
  date: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  color?: string;
}

export type CalendarEventInput = Omit<CalendarEvent, 'id'> & { id?: string };

export type ViewType = 'month' | 'week' | 'day' | (string & {});

export interface CalendarState {
  cursor: Date;
  view: ViewType;
  selected: Date[];
  events: CalendarEvent[];
}

export interface NavigationStrategy {
  next: (cursor: Date) => Date;
  prev: (cursor: Date) => Date;
}

export interface CalendarStoreOptions {
  defaultDate?: Date;
  defaultView?: ViewType;
  navigation?: Record<string, NavigationStrategy>;
}

export interface CalendarStore {
  getState(): CalendarState;
  subscribe(listener: (state: CalendarState) => void): () => void;
  next(): void;
  prev(): void;
  today(): void;
  setCursor(date: Date): void;
  setView(view: ViewType): void;
  select(date: Date): void;
  selectRange(start: Date, end: Date): void;
  toggleSelect(date: Date): void;
  clearSelection(): void;
  isSelected(date: Date): boolean;
  addEvent(event: CalendarEventInput): void;
  removeEvent(id: string): void;
  updateEvent(id: string, patch: Partial<CalendarEvent>): void;
  getEventsForDate(date: Date): CalendarEvent[];
  getEventsForRange(start: Date, end: Date): CalendarEvent[];
}

export interface BuildContext {
  cursor: Date;
  view: ViewType;
  options: ViewBuilderOptions;
}

export type PipeFn<TIn extends BaseCell, TOut extends TIn> = (
  cells: TIn[][],
  context: BuildContext,
) => TOut[][];

export type ViewGenerator = (cursor: Date, options: ViewBuilderOptions) => BaseCell[][];

export interface ViewBuilderOptions {
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  dayStartHour?: number;
  dayEndHour?: number;
  slotInterval?: number;
}

export interface ViewBuilder<TCell extends BaseCell> {
  pipe<TExtra = {}>(
    fn: (cells: TCell[][], context: BuildContext) => (TCell & TExtra)[][],
  ): ViewBuilder<TCell & TExtra>;

  register(viewName: string, generator: ViewGenerator): ViewBuilder<TCell>;

  build(cursor: Date, view?: ViewType): TCell[][] & { meta?: Record<string, unknown> };
}
