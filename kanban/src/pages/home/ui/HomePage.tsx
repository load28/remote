'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Modal } from '@/shared/ui';
import { BoardCard, useBoardStore } from '@/entities/board';
import styles from './HomePage.module.css';

export function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  const boards = useBoardStore((state) => state.boards);
  const createBoard = useBoardStore((state) => state.createBoard);
  const deleteBoard = useBoardStore((state) => state.deleteBoard);

  const handleCreateBoard = () => {
    if (!newBoardTitle.trim()) return;

    const board = createBoard({ title: newBoardTitle.trim() });
    setNewBoardTitle('');
    setIsCreating(false);
    router.push(`/board/${board.id}`);
  };

  const handleDeleteBoard = (boardId: string) => {
    if (window.confirm('Are you sure you want to delete this board?')) {
      deleteBoard(boardId);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Kanban Boards</h1>
        <Button onClick={() => setIsCreating(true)}>Create Board</Button>
      </header>

      <main className={styles.main}>
        {boards.length === 0 ? (
          <div className={styles.empty}>
            <p>No boards yet. Create your first board to get started!</p>
            <Button onClick={() => setIsCreating(true)}>
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
          />
          <div className={styles.formActions}>
            <Button type="submit" disabled={!newBoardTitle.trim()}>
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
