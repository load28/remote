import type { Card, CreateCardDto, UpdateCardDto, MoveCardDto } from '../model/types';

export const cardApi = {
  async create(boardId: string, columnId: string, dto: Omit<CreateCardDto, 'columnId'>): Promise<Card> {
    const res = await fetch(`/api/boards/${boardId}/columns/${columnId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to create card');
    return res.json();
  },

  async update(boardId: string, cardId: string, dto: UpdateCardDto): Promise<Card> {
    const res = await fetch(`/api/boards/${boardId}/cards/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to update card');
    return res.json();
  },

  async delete(boardId: string, cardId: string): Promise<void> {
    const res = await fetch(`/api/boards/${boardId}/cards/${cardId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete card');
  },

  async move(boardId: string, dto: MoveCardDto): Promise<Card> {
    const res = await fetch(`/api/boards/${boardId}/cards/${dto.cardId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetColumnId: dto.targetColumnId,
        targetOrder: dto.targetOrder,
      }),
    });
    if (!res.ok) throw new Error('Failed to move card');
    return res.json();
  },
};
