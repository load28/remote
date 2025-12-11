import { v4 as uuidv4 } from 'uuid';
import type { Board } from '@/entities/board';
import type { Column } from '@/entities/column';
import type { Card } from '@/entities/card';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: string;
}

interface MockDb {
  users: User[];
  boards: Board[];
}

const createInitialData = (): MockDb => {
  const userId = 'user-1';
  const boardId = 'board-1';
  const now = new Date().toISOString();

  const columns: Column[] = [
    {
      id: 'col-1',
      title: 'To Do',
      boardId,
      order: 0,
      cards: [
        {
          id: 'card-1',
          title: 'Design login page',
          description: 'Create UI mockups for the login page',
          columnId: 'col-1',
          order: 0,
          createdAt: now,
          updatedAt: now,
          labels: [{ id: 'label-1', name: 'Design', color: '#8B5CF6' }],
        },
        {
          id: 'card-2',
          title: 'Setup authentication',
          description: 'Implement Auth.js with Supabase',
          columnId: 'col-1',
          order: 1,
          createdAt: now,
          updatedAt: now,
          labels: [{ id: 'label-2', name: 'Backend', color: '#10B981' }],
        },
      ],
      createdAt: now,
    },
    {
      id: 'col-2',
      title: 'In Progress',
      boardId,
      order: 1,
      cards: [
        {
          id: 'card-3',
          title: 'Implement drag and drop',
          description: 'Add drag and drop functionality using dnd-kit',
          columnId: 'col-2',
          order: 0,
          createdAt: now,
          updatedAt: now,
          labels: [{ id: 'label-3', name: 'Feature', color: '#3B82F6' }],
        },
      ],
      createdAt: now,
    },
    {
      id: 'col-3',
      title: 'Done',
      boardId,
      order: 2,
      cards: [
        {
          id: 'card-4',
          title: 'Project setup',
          description: 'Initialize Next.js project with FSD architecture',
          columnId: 'col-3',
          order: 0,
          createdAt: now,
          updatedAt: now,
          labels: [{ id: 'label-4', name: 'Setup', color: '#F59E0B' }],
        },
      ],
      createdAt: now,
    },
  ];

  return {
    users: [
      {
        id: userId,
        email: 'demo@example.com',
        name: 'Demo User',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        createdAt: now,
      },
    ],
    boards: [
      {
        id: boardId,
        title: 'My First Board',
        columns,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
};

class MockDatabase {
  private data: MockDb;

  constructor() {
    this.data = createInitialData();
  }

  // User methods
  getUsers() {
    return this.data.users;
  }

  getUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string) {
    return this.data.users.find((u) => u.email === email);
  }

  createUser(userData: Omit<User, 'id' | 'createdAt'>) {
    const user: User = {
      ...userData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(user);
    return user;
  }

  // Board methods
  getBoards() {
    return this.data.boards;
  }

  getBoardById(id: string) {
    return this.data.boards.find((b) => b.id === id);
  }

  createBoard(title: string): Board {
    const now = new Date().toISOString();
    const board: Board = {
      id: uuidv4(),
      title,
      columns: [],
      createdAt: now,
      updatedAt: now,
    };
    this.data.boards.push(board);
    return board;
  }

  updateBoard(id: string, updates: { title?: string }): Board | null {
    const board = this.getBoardById(id);
    if (!board) return null;
    if (updates.title) board.title = updates.title;
    board.updatedAt = new Date().toISOString();
    return board;
  }

  deleteBoard(id: string): boolean {
    const index = this.data.boards.findIndex((b) => b.id === id);
    if (index === -1) return false;
    this.data.boards.splice(index, 1);
    return true;
  }

  // Column methods
  createColumn(boardId: string, title: string): Column | null {
    const board = this.getBoardById(boardId);
    if (!board) return null;
    const column: Column = {
      id: uuidv4(),
      title,
      boardId,
      order: board.columns.length,
      cards: [],
      createdAt: new Date().toISOString(),
    };
    board.columns.push(column);
    board.updatedAt = new Date().toISOString();
    return column;
  }

  updateColumn(boardId: string, columnId: string, title: string): Column | null {
    const board = this.getBoardById(boardId);
    if (!board) return null;
    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return null;
    column.title = title;
    board.updatedAt = new Date().toISOString();
    return column;
  }

  deleteColumn(boardId: string, columnId: string): boolean {
    const board = this.getBoardById(boardId);
    if (!board) return false;
    const index = board.columns.findIndex((c) => c.id === columnId);
    if (index === -1) return false;
    board.columns.splice(index, 1);
    board.columns.forEach((col, i) => (col.order = i));
    board.updatedAt = new Date().toISOString();
    return true;
  }

  // Card methods
  createCard(boardId: string, columnId: string, data: { title: string; description?: string }): Card | null {
    const board = this.getBoardById(boardId);
    if (!board) return null;
    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return null;
    const now = new Date().toISOString();
    const card: Card = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      columnId,
      order: column.cards.length,
      createdAt: now,
      updatedAt: now,
      labels: [],
    };
    column.cards.push(card);
    board.updatedAt = now;
    return card;
  }

  updateCard(boardId: string, cardId: string, updates: { title?: string; description?: string }): Card | null {
    const board = this.getBoardById(boardId);
    if (!board) return null;
    for (const column of board.columns) {
      const card = column.cards.find((c) => c.id === cardId);
      if (card) {
        if (updates.title !== undefined) card.title = updates.title;
        if (updates.description !== undefined) card.description = updates.description;
        card.updatedAt = new Date().toISOString();
        board.updatedAt = card.updatedAt;
        return card;
      }
    }
    return null;
  }

  deleteCard(boardId: string, cardId: string): boolean {
    const board = this.getBoardById(boardId);
    if (!board) return false;
    for (const column of board.columns) {
      const index = column.cards.findIndex((c) => c.id === cardId);
      if (index !== -1) {
        column.cards.splice(index, 1);
        column.cards.forEach((c, i) => (c.order = i));
        board.updatedAt = new Date().toISOString();
        return true;
      }
    }
    return false;
  }

  moveCard(boardId: string, cardId: string, targetColumnId: string, targetOrder: number): Card | null {
    const board = this.getBoardById(boardId);
    if (!board) return null;

    let movedCard: Card | null = null;
    let sourceColumn: Column | null = null;

    for (const column of board.columns) {
      const index = column.cards.findIndex((c) => c.id === cardId);
      if (index !== -1) {
        movedCard = column.cards.splice(index, 1)[0];
        sourceColumn = column;
        break;
      }
    }

    if (!movedCard) return null;

    const targetColumn = board.columns.find((c) => c.id === targetColumnId);
    if (!targetColumn) {
      sourceColumn?.cards.push(movedCard);
      return null;
    }

    movedCard.columnId = targetColumnId;
    movedCard.order = targetOrder;
    movedCard.updatedAt = new Date().toISOString();

    targetColumn.cards.splice(targetOrder, 0, movedCard);
    targetColumn.cards.forEach((c, i) => (c.order = i));

    if (sourceColumn && sourceColumn.id !== targetColumnId) {
      sourceColumn.cards.forEach((c, i) => (c.order = i));
    }

    board.updatedAt = movedCard.updatedAt;
    return movedCard;
  }

  reset() {
    this.data = createInitialData();
  }
}

export const mockDb = new MockDatabase();
