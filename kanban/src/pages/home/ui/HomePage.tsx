'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Input, Modal } from '@/shared/ui';
import { BoardCard, useBoardStore, useBoardsQuery, useCreateBoardMutation, useDeleteBoardMutation } from '@/entities/board';
import { UserAvatar } from '@/entities/user';
import { LogoutButton } from '@/features/auth';
import styles from './HomePage.module.css';

export function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  // React Query hooks
  const { data: queryBoards, isLoading } = useBoardsQuery();
  const createBoardMutation = useCreateBoardMutation();
  const deleteBoardMutation = useDeleteBoardMutation();

  // Fallback to Zustand store for offline/SSR
  const storeBoards = useBoardStore((state) => state.boards);
  const createBoardStore = useBoardStore((state) => state.createBoard);
  const deleteBoardStore = useBoardStore((state) => state.deleteBoard);

  const boards = queryBoards ?? storeBoards;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;

    try {
      const board = await createBoardMutation.mutateAsync({ title: newBoardTitle.trim() });
      setNewBoardTitle('');
      setIsCreating(false);
      router.push(`/board/${board.id}`);
    } catch {
      // Fallback to store
      const board = createBoardStore({ title: newBoardTitle.trim() });
      setNewBoardTitle('');
      setIsCreating(false);
      router.push(`/board/${board.id}`);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (window.confirm('Are you sure you want to delete this board?')) {
      try {
        await deleteBoardMutation.mutateAsync(boardId);
      } catch {
        deleteBoardStore(boardId);
      }
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Kanban Boards</h1>
        <div className={styles.headerRight}>
          <Button onClick={() => setIsCreating(true)} data-testid="create-board-button">
            Create Board
          </Button>
          <div className={styles.userSection}>
            <UserAvatar size="sm" />
            <span className={styles.userName} data-testid="user-name">{session?.user?.name}</span>
            <LogoutButton variant="ghost" />
          </div>
        </div>
      </header>

      <main className={styles.main} data-testid="board-list">
        {boards.length === 0 ? (
          <div className={styles.empty}>
            <p>No boards yet. Create your first board to get started!</p>
            <Button onClick={() => setIsCreating(true)} data-testid="create-first-board-button">
              Create Your First Board
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onClick={() => router.push(`/board/${board.id}`)}
                actions={
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteBoard(board.id)}
                    data-testid="delete-board-button"
                  >
                    Delete
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </main>

      <Modal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Create New Board"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateBoard();
          }}
          className={styles.form}
        >
          <Input
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            placeholder="Board title"
            autoFocus
            data-testid="board-title-input"
          />
          <div className={styles.formActions}>
            <Button type="submit" disabled={!newBoardTitle.trim()} data-testid="submit-board-button">
              Create
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
