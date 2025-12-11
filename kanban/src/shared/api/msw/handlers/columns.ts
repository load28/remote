import { http, HttpResponse, delay } from 'msw';
import { mockDb } from '../db';

export const columnHandlers = [
  // Create column
  http.post('/api/boards/:boardId/columns', async ({ params, request }) => {
    await delay(200);
    const { boardId } = params;
    const body = await request.json() as { title: string };
    const column = mockDb.createColumn(boardId as string, body.title);

    if (!column) {
      return HttpResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(column, { status: 201 });
  }),

  // Update column
  http.patch('/api/boards/:boardId/columns/:columnId', async ({ params, request }) => {
    await delay(200);
    const { boardId, columnId } = params;
    const body = await request.json() as { title: string };
    const column = mockDb.updateColumn(
      boardId as string,
      columnId as string,
      body.title
    );

    if (!column) {
      return HttpResponse.json(
        { error: 'Column not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(column);
  }),

  // Delete column
  http.delete('/api/boards/:boardId/columns/:columnId', async ({ params }) => {
    await delay(200);
    const { boardId, columnId } = params;
    const success = mockDb.deleteColumn(boardId as string, columnId as string);

    if (!success) {
      return HttpResponse.json(
        { error: 'Column not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true });
  }),
];
