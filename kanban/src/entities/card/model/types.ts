export type CardPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export interface Card {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  labels?: CardLabel[];
  assigneeIds?: string[];
  dueDate?: string;
  dueDateCompleted?: boolean;
  priority?: CardPriority;
  checklistIds?: string[];
  commentCount?: number;
  attachmentCount?: number;
  coverImage?: string;
  isArchived?: boolean;
}

export interface CardLabel {
  id: string;
  name: string;
  color: string;
}

export interface CreateCardDto {
  title: string;
  description?: string;
  columnId: string;
  assigneeIds?: string[];
  dueDate?: string;
  priority?: CardPriority;
}

export interface UpdateCardDto {
  title?: string;
  description?: string;
  labels?: CardLabel[];
  assigneeIds?: string[];
  dueDate?: string;
  dueDateCompleted?: boolean;
  priority?: CardPriority;
  coverImage?: string;
  isArchived?: boolean;
}

export interface MoveCardDto {
  cardId: string;
  targetColumnId: string;
  targetOrder: number;
}

export const CARD_PRIORITY_LABELS: Record<CardPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'None',
};

export const CARD_PRIORITY_COLORS: Record<CardPriority, string> = {
  urgent: '#DC2626',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
  none: '#9CA3AF',
};

export function isDueDateOverdue(dueDate: string | undefined, isCompleted?: boolean): boolean {
  if (!dueDate || isCompleted) return false;
  return new Date(dueDate) < new Date();
}

export function isDueDateSoon(dueDate: string | undefined, isCompleted?: boolean): boolean {
  if (!dueDate || isCompleted) return false;
  const due = new Date(dueDate);
  const now = new Date();
  const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= 24;
}

export function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const now = new Date();
  const isThisYear = date.getFullYear() === now.getFullYear();

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: isThisYear ? undefined : 'numeric',
  });
}
