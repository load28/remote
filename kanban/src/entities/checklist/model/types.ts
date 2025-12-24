export interface Checklist {
  id: string;
  title: string;
  cardId: string;
  items: ChecklistItem[];
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  assigneeId?: string;
  dueDate?: string;
  order: number;
}

export interface CreateChecklistDto {
  title: string;
}

export interface CreateChecklistItemDto {
  title: string;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateChecklistItemDto {
  title?: string;
  isCompleted?: boolean;
  assigneeId?: string;
  dueDate?: string;
}

export function getChecklistProgress(checklist: Checklist): { completed: number; total: number; percentage: number } {
  const total = checklist.items.length;
  const completed = checklist.items.filter((item) => item.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}
