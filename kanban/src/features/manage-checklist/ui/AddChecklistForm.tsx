'use client';

import { useState } from 'react';
import styles from './AddChecklistForm.module.css';

interface AddChecklistFormProps {
  onAdd: (title: string) => void;
  onCancel: () => void;
}

export function AddChecklistForm({ onAdd, onCancel }: AddChecklistFormProps) {
  const [title, setTitle] = useState('Checklist');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h4 className={styles.title}>Add Checklist</h4>
        <button type="button" className={styles.closeButton} onClick={onCancel}>
          ×
        </button>
      </div>
      <div className={styles.content}>
        <label className={styles.label}>Title</label>
        <input
          type="text"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>
      <div className={styles.footer}>
        <button type="submit" className={styles.addButton}>
          Add
        </button>
      </div>
    </form>
  );
}
