import type {
  Checklist,
  CreateChecklistDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
} from '../model';

const API_BASE = '/api';

export const checklistApi = {
  getChecklists: async (boardId: string, cardId: string): Promise<Checklist[]> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/cards/${cardId}/checklists`);
    if (!response.ok) throw new Error('Failed to fetch checklists');
    return response.json();
  },

  createChecklist: async (boardId: string, cardId: string, data: CreateChecklistDto): Promise<Checklist> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/cards/${cardId}/checklists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create checklist');
    return response.json();
  },

  deleteChecklist: async (boardId: string, cardId: string, checklistId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/cards/${cardId}/checklists/${checklistId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete checklist');
  },

  addItem: async (
    boardId: string,
    cardId: string,
    checklistId: string,
    data: CreateChecklistItemDto
  ): Promise<Checklist> => {
    const response = await fetch(
      `${API_BASE}/boards/${boardId}/cards/${cardId}/checklists/${checklistId}/items`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) throw new Error('Failed to add checklist item');
    return response.json();
  },

  updateItem: async (
    boardId: string,
    cardId: string,
    checklistId: string,
    itemId: string,
    data: UpdateChecklistItemDto
  ): Promise<Checklist> => {
    const response = await fetch(
      `${API_BASE}/boards/${boardId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) throw new Error('Failed to update checklist item');
    return response.json();
  },

  deleteItem: async (
    boardId: string,
    cardId: string,
    checklistId: string,
    itemId: string
  ): Promise<void> => {
    const response = await fetch(
      `${API_BASE}/boards/${boardId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}`,
      {
        method: 'DELETE',
      }
    );
    if (!response.ok) throw new Error('Failed to delete checklist item');
  },

  toggleItem: async (
    boardId: string,
    cardId: string,
    checklistId: string,
    itemId: string,
    isCompleted: boolean
  ): Promise<Checklist> => {
    return checklistApi.updateItem(boardId, cardId, checklistId, itemId, { isCompleted });
  },
};
