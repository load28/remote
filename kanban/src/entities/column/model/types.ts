import type { Card } from '@/entities/card/@x/column';

export interface Column {
  id: string;
  title: string;
  boardId: string;
  order: number;
  cards: Card[];
  createdAt: string;
}

export interface CreateColumnDto {
  title: string;
  boardId: string;
}

export interface UpdateColumnDto {
  title?: string;
}
