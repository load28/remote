'use client';

import { useState } from 'react';
import styles from './LabelPicker.module.css';
import { LabelBadge, LABEL_COLORS } from '@/entities/label';
import type { Label } from '@/entities/label';
import type { CardLabel } from '@/entities/card';

interface LabelPickerProps {
  labels: Label[];
  selectedLabels: CardLabel[];
  onToggle: (label: Label) => void;
  onCreate: (name: string, color: string) => void;
  onClose: () => void;
}

export function LabelPicker({
  labels,
  selectedLabels,
  onToggle,
  onCreate,
  onClose,
}: LabelPickerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].value);

  const selectedIds = selectedLabels.map((l) => l.id);

  const handleCreate = () => {
    if (newLabelName.trim()) {
      onCreate(newLabelName.trim(), selectedColor);
      setNewLabelName('');
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.picker}>
      <div className={styles.header}>
        <h4 className={styles.title}>Labels</h4>
        <button type="button" className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>

      <div className={styles.labelList}>
        {labels.map((label) => (
          <button
            key={label.id}
            type="button"
            className={`${styles.labelItem} ${selectedIds.includes(label.id) ? styles.selected : ''}`}
            onClick={() => onToggle(label)}
          >
            <span className={styles.colorDot} style={{ backgroundColor: label.color }} />
            <span className={styles.labelName}>{label.name}</span>
            {selectedIds.includes(label.id) && <span className={styles.checkmark}>✓</span>}
          </button>
        ))}
      </div>

      {isCreating ? (
        <div className={styles.createForm}>
          <input
            type="text"
            className={styles.nameInput}
            placeholder="Label name"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            autoFocus
          />
          <div className={styles.colorGrid}>
            {LABEL_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`${styles.colorOption} ${selectedColor === color.value ? styles.selectedColor : ''}`}
                style={{ backgroundColor: color.value }}
                onClick={() => setSelectedColor(color.value)}
                title={color.name}
              />
            ))}
          </div>
          <div className={styles.createActions}>
            <button type="button" className={styles.createButton} onClick={handleCreate}>
              Create
            </button>
            <button type="button" className={styles.cancelButton} onClick={() => setIsCreating(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={styles.createNewButton}
          onClick={() => setIsCreating(true)}
        >
          + Create new label
        </button>
      )}
    </div>
  );
}
