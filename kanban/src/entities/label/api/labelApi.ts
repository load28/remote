import type { Label, CreateLabelDto, UpdateLabelDto } from '../model';

const API_BASE = '/api';

export const labelApi = {
  getLabels: async (boardId: string): Promise<Label[]> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/labels`);
    if (!response.ok) throw new Error('Failed to fetch labels');
    return response.json();
  },

  createLabel: async (boardId: string, data: CreateLabelDto): Promise<Label> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create label');
    return response.json();
  },

  updateLabel: async (boardId: string, labelId: string, data: UpdateLabelDto): Promise<Label> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/labels/${labelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update label');
    return response.json();
  },

  deleteLabel: async (boardId: string, labelId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/labels/${labelId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete label');
  },

  addLabelToCard: async (boardId: string, cardId: string, labelId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/cards/${cardId}/labels/${labelId}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to add label to card');
  },

  removeLabelFromCard: async (boardId: string, cardId: string, labelId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/cards/${cardId}/labels/${labelId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove label from card');
  },
};
