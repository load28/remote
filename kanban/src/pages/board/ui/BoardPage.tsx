'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBoardStore } from '@/entities/board';
import { BoardHeader } from '@/widgets/board-header';
import { KanbanBoard } from '@/widgets/kanban-board';
import styles from './BoardPage.module.css';

interface BoardPageProps {
  boardId: string;
}

export function BoardPage({ boardId }: BoardPageProps) {
  const router = useRouter();
  const boards = useBoardStore((state) => state.boards);
  const setCurrentBoard = useBoardStore((state) => state.setCurrentBoard);

  const board = boards.find((b) => b.id === boardId);

  useEffect(() => {
    if (board) {
      setCurrentBoard(boardId);
    }

    return () => {
      setCurrentBoard(null);
    };
  }, [board, boardId, setCurrentBoard]);

  if (!board) {
    return (
      <div className={styles.notFound}>
        <h1>Board not found</h1>
        <p>The board you're looking for doesn't exist.</p>
        <button onClick={() => router.push('/')}>Go back home</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <BoardHeader board={board} />
      <KanbanBoard board={board} />
    </div>
  );
}
