'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Card } from '@/entities/card';
import { isDueDateOverdue } from '@/entities/card';
import type { CardFilters, DueDateFilter } from './types';
import { DEFAULT_FILTERS } from './types';

export function useCardFilters(initialFilters: Partial<CardFilters> = {}) {
  const [filters, setFilters] = useState<CardFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const updateFilter = useCallback(<K extends keyof CardFilters>(
    key: K,
    value: CardFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.labelIds.length > 0 ||
      filters.assigneeIds.length > 0 ||
      filters.priority !== 'all' ||
      filters.dueDate !== 'all' ||
      filters.showArchived
    );
  }, [filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  };
}

export function filterCards(cards: Card[], filters: CardFilters): Card[] {
  return cards.filter((card) => {
    // Archived filter
    if (!filters.showArchived && card.isArchived) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = card.title.toLowerCase().includes(searchLower);
      const descMatch = card.description?.toLowerCase().includes(searchLower);
      if (!titleMatch && !descMatch) {
        return false;
      }
    }

    // Label filter
    if (filters.labelIds.length > 0) {
      const cardLabelIds = card.labels?.map((l) => l.id) || [];
      const hasMatchingLabel = filters.labelIds.some((id) => cardLabelIds.includes(id));
      if (!hasMatchingLabel) {
        return false;
      }
    }

    // Assignee filter
    if (filters.assigneeIds.length > 0) {
      const hasMatchingAssignee = filters.assigneeIds.some((id) =>
        card.assigneeIds?.includes(id)
      );
      if (!hasMatchingAssignee) {
        return false;
      }
    }

    // Priority filter
    if (filters.priority !== 'all') {
      if (card.priority !== filters.priority) {
        return false;
      }
    }

    // Due date filter
    if (filters.dueDate !== 'all') {
      if (!matchDueDateFilter(card.dueDate, card.dueDateCompleted, filters.dueDate)) {
        return false;
      }
    }

    return true;
  });
}

function matchDueDateFilter(
  dueDate: string | undefined,
  isCompleted: boolean | undefined,
  filter: DueDateFilter
): boolean {
  if (filter === 'no-date') {
    return !dueDate;
  }

  if (!dueDate) return false;

  const due = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
  const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  switch (filter) {
    case 'overdue':
      return isDueDateOverdue(dueDate, isCompleted);
    case 'due-today':
      return due >= today && due <= endOfDay;
    case 'due-week':
      return due >= today && due <= endOfWeek;
    case 'due-month':
      return due >= today && due <= endOfMonth;
    default:
      return true;
  }
}
