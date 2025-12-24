import { http, HttpResponse, delay } from 'msw';
import { mockDb } from '../db';

export const memberHandlers = [
  // Get members for a board
  http.get('/api/boards/:boardId/members', async ({ params }) => {
    await delay(150);
    const { boardId } = params;
    const members = mockDb.getMembers(boardId as string);
    return HttpResponse.json(members);
  }),

  // Invite member
  http.post('/api/boards/:boardId/members', async ({ params, request }) => {
    await delay(200);
    const { boardId } = params;
    const body = await request.json() as { email: string; role: string };
    const member = mockDb.inviteMember(boardId as string, body);

    if (!member) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return HttpResponse.json(member, { status: 201 });
  }),

  // Update member role
  http.patch('/api/boards/:boardId/members/:memberId', async ({ params, request }) => {
    await delay(200);
    const { boardId, memberId } = params;
    const body = await request.json() as { role: string };
    const member = mockDb.updateMemberRole(boardId as string, memberId as string, body.role);

    if (!member) {
      return HttpResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return HttpResponse.json(member);
  }),

  // Remove member
  http.delete('/api/boards/:boardId/members/:memberId', async ({ params }) => {
    await delay(200);
    const { boardId, memberId } = params;
    const success = mockDb.removeMember(boardId as string, memberId as string);

    if (!success) {
      return HttpResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return HttpResponse.json({ success: true });
  }),

  // Assign member to card
  http.post('/api/boards/:boardId/cards/:cardId/assignees/:memberId', async ({ params }) => {
    await delay(150);
    const { boardId, cardId, memberId } = params;
    const success = mockDb.assignMemberToCard(boardId as string, cardId as string, memberId as string);

    if (!success) {
      return HttpResponse.json({ error: 'Failed to assign member' }, { status: 400 });
    }

    return HttpResponse.json({ success: true });
  }),

  // Unassign member from card
  http.delete('/api/boards/:boardId/cards/:cardId/assignees/:memberId', async ({ params }) => {
    await delay(150);
    const { boardId, cardId, memberId } = params;
    const success = mockDb.unassignMemberFromCard(boardId as string, cardId as string, memberId as string);

    if (!success) {
      return HttpResponse.json({ error: 'Failed to unassign member' }, { status: 400 });
    }

    return HttpResponse.json({ success: true });
  }),
];
