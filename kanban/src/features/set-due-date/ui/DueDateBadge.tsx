'use client';

import styles from './DueDateBadge.module.css';
import { formatDueDate, isDueDateOverdue, isDueDateSoon } from '@/entities/card';

interface DueDateBadgeProps {
  dueDate: string;
  isCompleted?: boolean;
  onClick?: () => void;
}

export function DueDateBadge({ dueDate, isCompleted = false, onClick }: DueDateBadgeProps) {
  const isOverdue = isDueDateOverdue(dueDate, isCompleted);
  const isSoon = isDueDateSoon(dueDate, isCompleted);

  const getStatusClass = () => {
    if (isCompleted) return styles.completed;
    if (isOverdue) return styles.overdue;
    if (isSoon) return styles.soon;
    return '';
  };

  return (
    <button
      type="button"
      className={`${styles.badge} ${getStatusClass()} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
    >
      <span className={styles.icon}>
        {isCompleted ? '✓' : '📅'}
      </span>
      <span className={styles.date}>{formatDueDate(dueDate)}</span>
    </button>
  );
}
