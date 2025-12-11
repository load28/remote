import { Column } from '@/entities/column';

export interface Board {
  id: string;
  title: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardDto {
  title: string;
}

export interface UpdateBoardDto {
  title?: string;
}
