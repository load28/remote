import type { Activity } from '../model';

const API_BASE = '/api';

export const activityApi = {
  getCardActivities: async (boardId: string, cardId: string): Promise<Activity[]> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/cards/${cardId}/activities`);
    if (!response.ok) throw new Error('Failed to fetch activities');
    return response.json();
  },

  getBoardActivities: async (boardId: string, limit?: number): Promise<Activity[]> => {
    const url = new URL(`${API_BASE}/boards/${boardId}/activities`, window.location.origin);
    if (limit) url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch activities');
    return response.json();
  },
};
