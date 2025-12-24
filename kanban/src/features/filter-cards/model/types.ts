import type { CardPriority } from '@/entities/card';

export interface CardFilters {
  search: string;
  labelIds: string[];
  assigneeIds: string[];
  priority: CardPriority | 'all';
  dueDate: DueDateFilter;
  showArchived: boolean;
}

export type DueDateFilter = 'all' | 'no-date' | 'overdue' | 'due-today' | 'due-week' | 'due-month';

export const DEFAULT_FILTERS: CardFilters = {
  search: '',
  labelIds: [],
  assigneeIds: [],
  priority: 'all',
  dueDate: 'all',
  showArchived: false,
};

export const DUE_DATE_FILTER_LABELS: Record<DueDateFilter, string> = {
  all: 'All dates',
  'no-date': 'No due date',
  overdue: 'Overdue',
  'due-today': 'Due today',
  'due-week': 'Due this week',
  'due-month': 'Due this month',
};
