'use client';

import styles from './ChecklistProgress.module.css';
import type { Checklist } from '../model';
import { getChecklistProgress } from '../model';

interface ChecklistProgressProps {
  checklist: Checklist;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ChecklistProgress({ checklist, showLabel = true, size = 'md' }: ChecklistProgressProps) {
  const { completed, total, percentage } = getChecklistProgress(checklist);

  return (
    <div className={`${styles.container} ${styles[size]}`}>
      {showLabel && (
        <span className={styles.label}>
          {completed}/{total}
        </span>
      )}
      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${percentage === 100 ? styles.complete : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && <span className={styles.percentage}>{percentage}%</span>}
    </div>
  );
}
