import { Card } from '@/entities/card';

export interface Column {
  id: string;
  title: string;
  boardId: string;
  order: number;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateColumnDto {
  title: string;
  boardId: string;
}

export interface UpdateColumnDto {
  title?: string;
}
