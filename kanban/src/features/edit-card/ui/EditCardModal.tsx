'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Input } from '@/shared/ui';
import { Card, cardApi } from '@/entities/card';
import { useBoardStore } from '@/entities/board';
import { queryKeys } from '@/shared/api/query';
import styles from './EditCardModal.module.css';

interface EditCardModalProps {
  card: Card | null;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EditCardModal({ card, boardId, isOpen, onClose }: EditCardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateCard = useBoardStore((state) => state.updateCard);
  const deleteCard = useBoardStore((state) => state.deleteCard);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
    }
  }, [card]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await cardApi.update(boardId, card.id, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
    } catch {
      // Fallback to Zustand store
      updateCard(card.id, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
    }
    setIsSubmitting(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!card || isSubmitting) return;
    if (window.confirm('Are you sure you want to delete this card?')) {
      setIsSubmitting(true);
      try {
        await cardApi.delete(boardId, card.id);
        await queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
      } catch {
        // Fallback to Zustand store
        deleteCard(card.id);
      }
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Card" data-testid="card-detail-modal">
      <form className={styles.form} onSubmit={handleSubmit} data-testid="card-detail-form">
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
          <Button type="submit" disabled={!title.trim() || isSubmitting} data-testid="save-card-button">
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} disabled={isSubmitting} data-testid="delete-card-button">
            Delete
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting} data-testid="cancel-button">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
