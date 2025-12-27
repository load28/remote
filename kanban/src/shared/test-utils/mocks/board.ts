import { v4 as uuid } from 'uuid';
import { Board } from '@/entities/board';
import { Column } from '@/entities/column';
import { Card, CardLabel } from '@/entities/card';

export function buildLabel(overrides: Partial<CardLabel> = {}): CardLabel {
  return {
    id: uuid(),
    name: 'Test Label',
    color: '#3b82f6',
    ...overrides,
  };
}

export function buildCard(overrides: Partial<Card> = {}): Card {
  return {
    id: uuid(),
    title: 'Test Card',
    description: 'Test Description',
    columnId: 'column-1',
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildCards(count: number, overrides: Partial<Card> = {}): Card[] {
  return Array.from({ length: count }, (_, i) =>
    buildCard({ title: `Card ${i + 1}`, order: i, ...overrides })
  );
}

export function buildColumn(overrides: Partial<Column> = {}): Column {
  return {
    id: uuid(),
    title: 'Test Column',
    boardId: 'board-1',
    order: 0,
    cards: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: uuid(),
    title: 'Test Board',
    columns: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export const mockBoards = {
  empty: [],
  single: [buildBoard({ id: 'board-1', title: 'Board 1' })],
  multiple: [
    buildBoard({ id: 'board-1', title: 'Board 1' }),
    buildBoard({ id: 'board-2', title: 'Board 2' }),
    buildBoard({ id: 'board-3', title: 'Board 3' }),
  ],
};

export const mockColumns = {
  todo: buildColumn({ id: 'col-1', title: 'To Do', order: 0 }),
  inProgress: buildColumn({ id: 'col-2', title: 'In Progress', order: 1 }),
  done: buildColumn({ id: 'col-3', title: 'Done', order: 2 }),
};
