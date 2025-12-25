import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBoardStore } from './store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('BoardStore Integration', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useBoardStore.setState({ boards: [], currentBoardId: null });
  });

  describe('Board operations', () => {
    it('creates a new board with default columns', () => {
      const { createBoard } = useBoardStore.getState();

      const board = createBoard({ title: 'New Project' });

      expect(board.title).toBe('New Project');
      expect(board.columns).toHaveLength(3);
      expect(board.columns.map((c) => c.title)).toEqual([
        'To Do',
        'In Progress',
        'Done',
      ]);
    });

    it('sets the new board as current after creation', () => {
      const { createBoard, currentBoardId } = useBoardStore.getState();

      const board = createBoard({ title: 'New Project' });

      const state = useBoardStore.getState();
      expect(state.currentBoardId).toBe(board.id);
    });

    it('updates board title', () => {
      const { createBoard, updateBoard } = useBoardStore.getState();
      const board = createBoard({ title: 'Original Title' });

      updateBoard(board.id, 'Updated Title');

      const state = useBoardStore.getState();
      const updatedBoard = state.boards.find((b) => b.id === board.id);
      expect(updatedBoard?.title).toBe('Updated Title');
    });

    it('deletes a board', () => {
      const { createBoard, deleteBoard } = useBoardStore.getState();
      const board = createBoard({ title: 'To Delete' });

      deleteBoard(board.id);

      const state = useBoardStore.getState();
      expect(state.boards.find((b) => b.id === board.id)).toBeUndefined();
    });

    it('clears currentBoardId when current board is deleted', () => {
      const { createBoard, deleteBoard } = useBoardStore.getState();
      const board = createBoard({ title: 'To Delete' });

      deleteBoard(board.id);

      const state = useBoardStore.getState();
      expect(state.currentBoardId).toBeNull();
    });

    it('gets current board', () => {
      const { createBoard, getCurrentBoard } = useBoardStore.getState();
      createBoard({ title: 'Current Board' });

      const currentBoard = useBoardStore.getState().getCurrentBoard();

      expect(currentBoard?.title).toBe('Current Board');
    });
  });

  describe('Column operations', () => {
    it('creates a new column', () => {
      const { createBoard, createColumn } = useBoardStore.getState();
      const board = createBoard({ title: 'Board' });

      createColumn({ title: 'New Column', boardId: board.id });

      const state = useBoardStore.getState();
      const updatedBoard = state.boards.find((b) => b.id === board.id);
      expect(updatedBoard?.columns).toHaveLength(4);
      expect(updatedBoard?.columns[3].title).toBe('New Column');
    });

    it('updates column title', () => {
      const { createBoard, updateColumn } = useBoardStore.getState();
      const board = createBoard({ title: 'Board' });
      const columnId = board.columns[0].id;

      updateColumn(columnId, 'Updated Column');

      const state = useBoardStore.getState();
      const updatedBoard = state.boards.find((b) => b.id === board.id);
      const updatedColumn = updatedBoard?.columns.find((c) => c.id === columnId);
      expect(updatedColumn?.title).toBe('Updated Column');
    });

    it('deletes a column', () => {
      const { createBoard, deleteColumn } = useBoardStore.getState();
      const board = createBoard({ title: 'Board' });
      const columnId = board.columns[0].id;

      deleteColumn(columnId);

      const state = useBoardStore.getState();
      const updatedBoard = state.boards.find((b) => b.id === board.id);
      expect(updatedBoard?.columns).toHaveLength(2);
    });
  });

  describe('Card operations', () => {
    it('creates a new card in a column', () => {
      const { createBoard, createCard } = useBoardStore.getState();
      const board = createBoard({ title: 'Board' });
      const columnId = board.columns[0].id;

      createCard({ title: 'New Task', columnId });

      const state = useBoardStore.getState();
      const updatedBoard = state.boards.find((b) => b.id === board.id);
      const column = updatedBoard?.columns.find((c) => c.id === columnId);
      expect(column?.cards).toHaveLength(1);
      expect(column?.cards[0].title).toBe('New Task');
    });

    it('creates a card with description', () => {
      const { createBoard, createCard } = useBoardStore.getState();
      const board = createBoard({ title: 'Board' });
      const columnId = board.columns[0].id;

      createCard({
        title: 'New Task',
        description: 'Task description',
        columnId,
      });

      const state = useBoardStore.getState();
      const updatedBoard = state.boards.find((b) => b.id === board.id);
      const column = updatedBoard?.columns.find((c) => c.id === columnId);
      expect(column?.cards[0].description).toBe('Task description');
    });

    it('updates a card', () => {
      const { createBoard, createCard, updateCard } = useBoardStore.getState();
      const board = createBoard({ title: 'Board' });
      const columnId = board.columns[0].id;

      createCard({ title: 'Original', columnId });

      let state = useBoardStore.getState();
      let updatedBoard = state.boards.find((b) => b.id === board.id);
      const cardId = updatedBoard?.columns[0].cards[0].id!;

      updateCard(cardId, { title: 'Updated', description: 'New description' });

      state = useBoardStore.getState();
      updatedBoard = state.boards.find((b) => b.id === board.id);
      const card = updatedBoard?.columns[0].cards[0];
      expect(card?.title).toBe('Updated');
      expect(card?.description).toBe('New description');
    });

    it('deletes a card', () => {
      const { createBoard, createCard, deleteCard } = useBoardStore.getState();
      const board = createBoard({ title: 'Board' });
      const columnId = board.columns[0].id;

      createCard({ title: 'To Delete', columnId });

      let state = useBoardStore.getState();
      let updatedBoard = state.boards.find((b) => b.id === board.id);
      const cardId = updatedBoard?.columns[0].cards[0].id!;

      deleteCard(cardId);

      state = useBoardStore.getState();
      updatedBoard = state.boards.find((b) => b.id === board.id);
      expect(updatedBoard?.columns[0].cards).toHaveLength(0);
    });

    it('moves a card to another column', () => {
      const { createBoard, createCard, moveCard } = useBoardStore.getState();
      const board = createBoard({ title: 'Board' });
      const fromColumnId = board.columns[0].id;
      const toColumnId = board.columns[1].id;

      createCard({ title: 'Moving Card', columnId: fromColumnId });

      let state = useBoardStore.getState();
      let updatedBoard = state.boards.find((b) => b.id === board.id);
      const cardId = updatedBoard?.columns[0].cards[0].id!;

      moveCard(cardId, toColumnId, 0);

      state = useBoardStore.getState();
      updatedBoard = state.boards.find((b) => b.id === board.id);

      const fromColumn = updatedBoard?.columns.find((c) => c.id === fromColumnId);
      const toColumn = updatedBoard?.columns.find((c) => c.id === toColumnId);

      expect(fromColumn?.cards).toHaveLength(0);
      expect(toColumn?.cards).toHaveLength(1);
      expect(toColumn?.cards[0].columnId).toBe(toColumnId);
    });

    it('moves a card within the same column', () => {
      const { createBoard, createCard, moveCard } = useBoardStore.getState();
      const board = createBoard({ title: 'Board' });
      const columnId = board.columns[0].id;

      createCard({ title: 'Card 1', columnId });
      createCard({ title: 'Card 2', columnId });
      createCard({ title: 'Card 3', columnId });

      let state = useBoardStore.getState();
      let updatedBoard = state.boards.find((b) => b.id === board.id);
      const cardId = updatedBoard?.columns[0].cards[0].id!;

      moveCard(cardId, columnId, 2);

      state = useBoardStore.getState();
      updatedBoard = state.boards.find((b) => b.id === board.id);
      const column = updatedBoard?.columns.find((c) => c.id === columnId);

      expect(column?.cards[2].title).toBe('Card 1');
    });
  });
});
