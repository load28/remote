'use client';

import { useState } from 'react';
import styles from './ChecklistItemRow.module.css';
import type { ChecklistItem } from '../model';

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggle: (isCompleted: boolean) => void;
  onUpdate: (title: string) => void;
  onDelete: () => void;
}

export function ChecklistItemRow({ item, onToggle, onUpdate, onDelete }: ChecklistItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.title);

  const handleSubmit = () => {
    if (editValue.trim() && editValue !== item.title) {
      onUpdate(editValue.trim());
    } else {
      setEditValue(item.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(item.title);
      setIsEditing(false);
    }
  };

  return (
    <div className={`${styles.row} ${item.isCompleted ? styles.completed : ''}`}>
      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={item.isCompleted}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className={styles.checkmark} />
      </label>

      {isEditing ? (
        <input
          type="text"
          className={styles.editInput}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <span
          className={styles.title}
          onDoubleClick={() => setIsEditing(true)}
        >
          {item.title}
        </span>
      )}

      <button
        type="button"
        className={styles.deleteButton}
        onClick={onDelete}
        aria-label="Delete item"
      >
        ×
      </button>
    </div>
  );
}
