'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/shared/ui';
import { Card } from '@/entities/card';
import { useBoardStore } from '@/entities/board';
import styles from './EditCardModal.module.css';

interface EditCardModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditCardModal({ card, isOpen, onClose }: EditCardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const updateCard = useBoardStore((state) => state.updateCard);
  const deleteCard = useBoardStore((state) => state.deleteCard);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
    }
  }, [card]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !title.trim()) return;

    updateCard(card.id, {
      title: title.trim(),
      description: description.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!card) return;
    if (window.confirm('Are you sure you want to delete this card?')) {
      deleteCard(card.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Card" data-testid="card-detail-modal">
      <form className={styles.form} onSubmit={handleSubmit} data-testid="card-detail-modal">
        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title"
            data-testid="card-title-input"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a more detailed description..."
            rows={4}
            data-testid="card-description-input"
          />
          {description && (
            <div data-testid="card-description">{description}</div>
          )}
        </div>
        <div className={styles.actions}>
          <Button type="submit" disabled={!title.trim()} data-testid="save-card-button">
            Save
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} data-testid="delete-card-button">
            Delete
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} data-testid="close-modal-button">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
