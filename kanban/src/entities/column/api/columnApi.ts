import type { Column, CreateColumnDto, UpdateColumnDto } from '../model/types';

export const columnApi = {
  async create(boardId: string, dto: Omit<CreateColumnDto, 'boardId'>): Promise<Column> {
    const res = await fetch(`/api/boards/${boardId}/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to create column');
    return res.json();
  },

  async update(boardId: string, columnId: string, dto: UpdateColumnDto): Promise<Column> {
    const res = await fetch(`/api/boards/${boardId}/columns/${columnId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to update column');
    return res.json();
  },

  async delete(boardId: string, columnId: string): Promise<void> {
    const res = await fetch(`/api/boards/${boardId}/columns/${columnId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete column');
  },
};
