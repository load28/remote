'use client';

import styles from './LabelBadge.module.css';
import type { Label } from '../model';

interface LabelBadgeProps {
  label: Pick<Label, 'name' | 'color'>;
  size?: 'sm' | 'md';
  showName?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export function LabelBadge({ label, size = 'sm', showName = true, onClick, onRemove }: LabelBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[size]} ${onClick ? styles.clickable : ''}`}
      style={{ backgroundColor: label.color }}
      onClick={onClick}
      title={label.name}
    >
      {showName && <span className={styles.name}>{label.name}</span>}
      {onRemove && (
        <button
          type="button"
          className={styles.removeButton}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${label.name} label`}
        >
          ×
        </button>
      )}
    </span>
  );
}
