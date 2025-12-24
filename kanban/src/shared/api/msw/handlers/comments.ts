import { http, HttpResponse, delay } from 'msw';
import { mockDb } from '../db';

export const commentHandlers = [
  // Get comments for a card
  http.get('/api/boards/:boardId/cards/:cardId/comments', async ({ params }) => {
    await delay(150);
    const { boardId, cardId } = params;
    const comments = mockDb.getComments(boardId as string, cardId as string);
    return HttpResponse.json(comments);
  }),

  // Create comment
  http.post('/api/boards/:boardId/cards/:cardId/comments', async ({ params, request }) => {
    await delay(200);
    const { boardId, cardId } = params;
    const body = await request.json() as { content: string };
    const comment = mockDb.createComment(boardId as string, cardId as string, body.content);

    if (!comment) {
      return HttpResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return HttpResponse.json(comment, { status: 201 });
  }),

  // Update comment
  http.patch('/api/boards/:boardId/cards/:cardId/comments/:commentId', async ({ params, request }) => {
    await delay(200);
    const { boardId, cardId, commentId } = params;
    const body = await request.json() as { content: string };
    const comment = mockDb.updateComment(
      boardId as string,
      cardId as string,
      commentId as string,
      body.content
    );

    if (!comment) {
      return HttpResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return HttpResponse.json(comment);
  }),

  // Delete comment
  http.delete('/api/boards/:boardId/cards/:cardId/comments/:commentId', async ({ params }) => {
    await delay(200);
    const { boardId, cardId, commentId } = params;
    const success = mockDb.deleteComment(boardId as string, cardId as string, commentId as string);

    if (!success) {
      return HttpResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return HttpResponse.json({ success: true });
  }),
];
