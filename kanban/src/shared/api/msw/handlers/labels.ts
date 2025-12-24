import { http, HttpResponse, delay } from 'msw';
import { mockDb } from '../db';

export const labelHandlers = [
  // Get labels for a board
  http.get('/api/boards/:boardId/labels', async ({ params }) => {
    await delay(150);
    const { boardId } = params;
    const labels = mockDb.getLabels(boardId as string);
    return HttpResponse.json(labels);
  }),

  // Create label
  http.post('/api/boards/:boardId/labels', async ({ params, request }) => {
    await delay(200);
    const { boardId } = params;
    const body = await request.json() as { name: string; color: string };
    const label = mockDb.createLabel(boardId as string, body);
    return HttpResponse.json(label, { status: 201 });
  }),

  // Update label
  http.patch('/api/boards/:boardId/labels/:labelId', async ({ params, request }) => {
    await delay(200);
    const { boardId, labelId } = params;
    const body = await request.json() as { name?: string; color?: string };
    const label = mockDb.updateLabel(boardId as string, labelId as string, body);

    if (!label) {
      return HttpResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    return HttpResponse.json(label);
  }),

  // Delete label
  http.delete('/api/boards/:boardId/labels/:labelId', async ({ params }) => {
    await delay(200);
    const { boardId, labelId } = params;
    const success = mockDb.deleteLabel(boardId as string, labelId as string);

    if (!success) {
      return HttpResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    return HttpResponse.json({ success: true });
  }),

  // Add label to card
  http.post('/api/boards/:boardId/cards/:cardId/labels/:labelId', async ({ params }) => {
    await delay(150);
    const { boardId, cardId, labelId } = params;
    const success = mockDb.addLabelToCard(boardId as string, cardId as string, labelId as string);

    if (!success) {
      return HttpResponse.json({ error: 'Failed to add label' }, { status: 400 });
    }

    return HttpResponse.json({ success: true });
  }),

  // Remove label from card
  http.delete('/api/boards/:boardId/cards/:cardId/labels/:labelId', async ({ params }) => {
    await delay(150);
    const { boardId, cardId, labelId } = params;
    const success = mockDb.removeLabelFromCard(boardId as string, cardId as string, labelId as string);

    if (!success) {
      return HttpResponse.json({ error: 'Failed to remove label' }, { status: 400 });
    }

    return HttpResponse.json({ success: true });
  }),
];
