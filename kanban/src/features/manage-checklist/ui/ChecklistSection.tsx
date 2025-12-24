'use client';

import { useState } from 'react';
import styles from './ChecklistSection.module.css';
import { ChecklistProgress, ChecklistItemRow } from '@/entities/checklist';
import type { Checklist } from '@/entities/checklist';

interface ChecklistSectionProps {
  checklist: Checklist;
  onToggleItem: (itemId: string, isCompleted: boolean) => void;
  onUpdateItem: (itemId: string, title: string) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (title: string) => void;
  onDelete: () => void;
}

export function ChecklistSection({
  checklist,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onDelete,
}: ChecklistSectionProps) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemTitle.trim()) {
      onAddItem(newItemTitle.trim());
      setNewItemTitle('');
    }
  };

  const completedItems = checklist.items.filter((item) => item.isCompleted);
  const visibleItems = hideCompleted
    ? checklist.items.filter((item) => !item.isCompleted)
    : checklist.items;

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.icon}>☑️</span>
          <h4 className={styles.title}>{checklist.title}</h4>
        </div>
        <div className={styles.actions}>
          {completedItems.length > 0 && (
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setHideCompleted(!hideCompleted)}
            >
              {hideCompleted ? `Show (${completedItems.length})` : 'Hide completed'}
            </button>
          )}
          <button
            type="button"
            className={styles.deleteButton}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>

      <ChecklistProgress checklist={checklist} />

      <div className={styles.items}>
        {visibleItems.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            onToggle={(isCompleted) => onToggleItem(item.id, isCompleted)}
            onUpdate={(title) => onUpdateItem(item.id, title)}
            onDelete={() => onDeleteItem(item.id)}
          />
        ))}
      </div>

      {showAddItem ? (
        <form className={styles.addItemForm} onSubmit={handleAddItem}>
          <input
            type="text"
            className={styles.addItemInput}
            placeholder="Add an item"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            autoFocus
          />
          <div className={styles.addItemActions}>
            <button type="submit" className={styles.addButton}>
              Add
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => {
                setShowAddItem(false);
                setNewItemTitle('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className={styles.showAddButton}
          onClick={() => setShowAddItem(true)}
        >
          + Add an item
        </button>
      )}
    </div>
  );
}
