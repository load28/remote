import { http, HttpResponse, delay } from 'msw';
import { mockDb } from '../db';

export const cardHandlers = [
  // Create card
  http.post('/api/boards/:boardId/columns/:columnId/cards', async ({ params, request }) => {
    await delay(200);
    const { boardId, columnId } = params;
    const body = await request.json() as { title: string; description?: string };
    const card = mockDb.createCard(boardId as string, columnId as string, body);

    if (!card) {
      return HttpResponse.json(
        { error: 'Column not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(card, { status: 201 });
  }),

  // Update card
  http.patch('/api/boards/:boardId/cards/:cardId', async ({ params, request }) => {
    await delay(200);
    const { boardId, cardId } = params;
    const body = await request.json() as { title?: string; description?: string };
    const card = mockDb.updateCard(boardId as string, cardId as string, body);

    if (!card) {
      return HttpResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(card);
  }),

  // Delete card
  http.delete('/api/boards/:boardId/cards/:cardId', async ({ params }) => {
    await delay(200);
    const { boardId, cardId } = params;
    const success = mockDb.deleteCard(boardId as string, cardId as string);

    if (!success) {
      return HttpResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true });
  }),

  // Move card
  http.post('/api/boards/:boardId/cards/:cardId/move', async ({ params, request }) => {
    await delay(150);
    const { boardId, cardId } = params;
    const body = await request.json() as { targetColumnId: string; targetOrder: number };
    const card = mockDb.moveCard(
      boardId as string,
      cardId as string,
      body.targetColumnId,
      body.targetOrder
    );

    if (!card) {
      return HttpResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(card);
  }),
];
