'use client';

import { ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { Board } from '../model/types';
import styles from './BoardCard.module.css';

interface BoardCardProps {
  board: Board;
  onClick?: () => void;
  actions?: ReactNode;
  isActive?: boolean;
}

export function BoardCard({ board, onClick, actions, isActive }: BoardCardProps) {
  const totalCards = board.columns.reduce(
    (sum, column) => sum + column.cards.length,
    0
  );

  return (
    <div
      className={cn(styles.card, isActive && styles.active)}
      onClick={onClick}
    >
      <div className={styles.content}>
        <h3 className={styles.title}>{board.title}</h3>
        <div className={styles.stats}>
          <span>{board.columns.length} columns</span>
          <span>{totalCards} cards</span>
        </div>
      </div>
      {actions && (
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}
