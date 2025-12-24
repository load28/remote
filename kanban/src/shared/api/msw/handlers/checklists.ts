import { http, HttpResponse, delay } from 'msw';
import { mockDb } from '../db';

export const checklistHandlers = [
  // Get checklists for a card
  http.get('/api/boards/:boardId/cards/:cardId/checklists', async ({ params }) => {
    await delay(150);
    const { boardId, cardId } = params;
    const checklists = mockDb.getChecklists(boardId as string, cardId as string);
    return HttpResponse.json(checklists);
  }),

  // Create checklist
  http.post('/api/boards/:boardId/cards/:cardId/checklists', async ({ params, request }) => {
    await delay(200);
    const { boardId, cardId } = params;
    const body = await request.json() as { title: string };
    const checklist = mockDb.createChecklist(boardId as string, cardId as string, body.title);

    if (!checklist) {
      return HttpResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return HttpResponse.json(checklist, { status: 201 });
  }),

  // Delete checklist
  http.delete('/api/boards/:boardId/cards/:cardId/checklists/:checklistId', async ({ params }) => {
    await delay(200);
    const { boardId, cardId, checklistId } = params;
    const success = mockDb.deleteChecklist(boardId as string, cardId as string, checklistId as string);

    if (!success) {
      return HttpResponse.json({ error: 'Checklist not found' }, { status: 404 });
    }

    return HttpResponse.json({ success: true });
  }),

  // Add checklist item
  http.post('/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items', async ({ params, request }) => {
    await delay(150);
    const { boardId, cardId, checklistId } = params;
    const body = await request.json() as { title: string };
    const checklist = mockDb.addChecklistItem(
      boardId as string,
      cardId as string,
      checklistId as string,
      body.title
    );

    if (!checklist) {
      return HttpResponse.json({ error: 'Checklist not found' }, { status: 404 });
    }

    return HttpResponse.json(checklist);
  }),

  // Update checklist item
  http.patch(
    '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId',
    async ({ params, request }) => {
      await delay(150);
      const { boardId, cardId, checklistId, itemId } = params;
      const body = await request.json() as { title?: string; isCompleted?: boolean };
      const checklist = mockDb.updateChecklistItem(
        boardId as string,
        cardId as string,
        checklistId as string,
        itemId as string,
        body
      );

      if (!checklist) {
        return HttpResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      return HttpResponse.json(checklist);
    }
  ),

  // Delete checklist item
  http.delete(
    '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId',
    async ({ params }) => {
      await delay(150);
      const { boardId, cardId, checklistId, itemId } = params;
      const success = mockDb.deleteChecklistItem(
        boardId as string,
        cardId as string,
        checklistId as string,
        itemId as string
      );

      if (!success) {
        return HttpResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      return HttpResponse.json({ success: true });
    }
  ),
];
