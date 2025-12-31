'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useBoardStore, useBoardsQuery } from '@/entities/board';
import { BoardHeader } from '@/widgets/board-header';
import { KanbanBoard } from '@/widgets/kanban-board';
import styles from './BoardPage.module.css';

interface BoardPageProps {
  boardId: string;
}

export function BoardPage({ boardId }: BoardPageProps) {
  const router = useRouter();
  const { status } = useSession();

  // React Query for API data
  const { data: queryBoards, isLoading } = useBoardsQuery();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Zustand store for offline/fallback
  const storeBoards = useBoardStore((state) => state.boards);
  const setCurrentBoard = useBoardStore((state) => state.setCurrentBoard);

  // Use React Query data first, then fall back to Zustand store
  const boards = queryBoards ?? storeBoards;
  const board = boards.find((b) => b.id === boardId);

  useEffect(() => {
    if (board) {
      setCurrentBoard(boardId);
    }

    return () => {
      setCurrentBoard(null);
    };
  }, [board, boardId, setCurrentBoard]);

  // Show loading while checking auth or fetching boards
  if (status === 'loading' || isLoading) {
    return (
      <div className={styles.notFound}>
        <p>Loading...</p>
      </div>
    );
  }

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
