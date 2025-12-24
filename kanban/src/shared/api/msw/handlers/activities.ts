import { http, HttpResponse, delay } from 'msw';
import { mockDb } from '../db';

export const activityHandlers = [
  // Get activities for a card
  http.get('/api/boards/:boardId/cards/:cardId/activities', async ({ params }) => {
    await delay(150);
    const { boardId, cardId } = params;
    const activities = mockDb.getCardActivities(boardId as string, cardId as string);
    return HttpResponse.json(activities);
  }),

  // Get activities for a board
  http.get('/api/boards/:boardId/activities', async ({ params, request }) => {
    await delay(150);
    const { boardId } = params;
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const activities = mockDb.getBoardActivities(
      boardId as string,
      limit ? parseInt(limit, 10) : undefined
    );
    return HttpResponse.json(activities);
  }),
];
