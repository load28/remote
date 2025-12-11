import { http, HttpResponse, delay } from 'msw';
import { mockDb } from '../db';

export const boardHandlers = [
  // Get all boards
  http.get('/api/boards', async () => {
    await delay(200);
    const boards = mockDb.getBoards();
    return HttpResponse.json(boards);
  }),

  // Get board by ID
  http.get('/api/boards/:id', async ({ params }) => {
    await delay(150);
    const { id } = params;
    const board = mockDb.getBoardById(id as string);

    if (!board) {
      return HttpResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(board);
  }),

  // Create board
  http.post('/api/boards', async ({ request }) => {
    await delay(300);
    const body = await request.json() as { title: string };
    const board = mockDb.createBoard(body.title);
    return HttpResponse.json(board, { status: 201 });
  }),

  // Update board
  http.patch('/api/boards/:id', async ({ params, request }) => {
    await delay(200);
    const { id } = params;
    const body = await request.json() as { title?: string };
    const board = mockDb.updateBoard(id as string, body);

    if (!board) {
      return HttpResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(board);
  }),

  // Delete board
  http.delete('/api/boards/:id', async ({ params }) => {
    await delay(200);
    const { id } = params;
    const success = mockDb.deleteBoard(id as string);

    if (!success) {
      return HttpResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true });
  }),
];
