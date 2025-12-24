'use client';

import { useState } from 'react';
import styles from './DueDatePicker.module.css';

interface DueDatePickerProps {
  currentDate?: string;
  isCompleted?: boolean;
  onSave: (date: string | null, isCompleted: boolean) => void;
  onClose: () => void;
}

export function DueDatePicker({
  currentDate,
  isCompleted = false,
  onSave,
  onClose,
}: DueDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState(
    currentDate ? new Date(currentDate).toISOString().split('T')[0] : ''
  );
  const [selectedTime, setSelectedTime] = useState(
    currentDate ? new Date(currentDate).toTimeString().slice(0, 5) : '12:00'
  );
  const [completed, setCompleted] = useState(isCompleted);

  const handleSave = () => {
    if (selectedDate) {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`).toISOString();
      onSave(dateTime, completed);
    }
    onClose();
  };

  const handleRemove = () => {
    onSave(null, false);
    onClose();
  };

  const presetDates = [
    { label: 'Today', days: 0 },
    { label: 'Tomorrow', days: 1 },
    { label: 'In 3 days', days: 3 },
    { label: 'In 1 week', days: 7 },
  ];

  const setPresetDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  return (
    <div className={styles.picker}>
      <div className={styles.header}>
        <h4 className={styles.title}>Due Date</h4>
        <button type="button" className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.presets}>
          {presetDates.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={styles.presetButton}
              onClick={() => setPresetDate(preset.days)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className={styles.dateTimeInputs}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Date</label>
            <input
              type="date"
              className={styles.input}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Time</label>
            <input
              type="time"
              className={styles.input}
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            />
          </div>
        </div>

        {currentDate && (
          <label className={styles.completedCheckbox}>
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
            />
            <span>Mark as complete</span>
          </label>
        )}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.saveButton} onClick={handleSave}>
          Save
        </button>
        {currentDate && (
          <button type="button" className={styles.removeButton} onClick={handleRemove}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
