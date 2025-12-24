import type { Member, InviteMemberDto, UpdateMemberRoleDto } from '../model';

const API_BASE = '/api';

export const memberApi = {
  getMembers: async (boardId: string): Promise<Member[]> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/members`);
    if (!response.ok) throw new Error('Failed to fetch members');
    return response.json();
  },

  inviteMember: async (boardId: string, data: InviteMemberDto): Promise<Member> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to invite member');
    return response.json();
  },

  updateMemberRole: async (boardId: string, memberId: string, data: UpdateMemberRoleDto): Promise<Member> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update member role');
    return response.json();
  },

  removeMember: async (boardId: string, memberId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/members/${memberId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove member');
  },

  assignToCard: async (boardId: string, cardId: string, memberId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/cards/${cardId}/assignees/${memberId}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to assign member to card');
  },

  unassignFromCard: async (boardId: string, cardId: string, memberId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/boards/${boardId}/cards/${cardId}/assignees/${memberId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to unassign member from card');
  },
};
