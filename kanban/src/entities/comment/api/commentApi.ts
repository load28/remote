import type { Comment, CreateCommentDto, UpdateCommentDto } from '../model';

const API_BASE = '/api';

export const commentApi = {
  getComments: async (boardId: string, cardId: string): Promise<Comment[]> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/cards/${cardId}/comments`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    return response.json();
  },

  createComment: async (boardId: string, cardId: string, data: CreateCommentDto): Promise<Comment> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/cards/${cardId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create comment');
    return response.json();
  },

  updateComment: async (
    boardId: string,
    cardId: string,
    commentId: string,
    data: UpdateCommentDto
  ): Promise<Comment> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/cards/${cardId}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update comment');
    return response.json();
  },

  deleteComment: async (boardId: string, cardId: string, commentId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/cards/${cardId}/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete comment');
  },
};
