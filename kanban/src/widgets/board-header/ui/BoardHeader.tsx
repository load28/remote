'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/shared/ui';
import { Board, useBoardStore } from '@/entities/board';
import styles from './BoardHeader.module.css';

interface BoardHeaderProps {
  board: Board;
}

export function BoardHeader({ board }: BoardHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const updateBoard = useBoardStore((state) => state.updateBoard);

  const handleSave = () => {
    if (title.trim() && title.trim() !== board.title) {
      updateBoard(board.id, title.trim());
    } else {
      setTitle(board.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setTitle(board.title);
      setIsEditing(false);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="/" className={styles.backLink}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        {isEditing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className={styles.titleInput}
          />
        ) : (
          <h1
            className={styles.title}
            onClick={() => setIsEditing(true)}
          >
            {board.title}
          </h1>
        )}
      </div>
      <div className={styles.right}>
        <span className={styles.stats}>
          {board.columns.reduce((sum, col) => sum + col.cards.length, 0)} cards
        </span>
      </div>
    </header>
  );
}
