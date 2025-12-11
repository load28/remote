import type { Board, CreateBoardDto, UpdateBoardDto } from '../model/types';

const API_BASE = '/api/boards';

export const boardApi = {
  async getAll(): Promise<Board[]> {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch boards');
    return res.json();
  },

  async getById(id: string): Promise<Board> {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Failed to fetch board');
    return res.json();
  },

  async create(dto: CreateBoardDto): Promise<Board> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to create board');
    return res.json();
  },

  async update(id: string, dto: UpdateBoardDto): Promise<Board> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to update board');
    return res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete board');
  },
};
