import { http, HttpResponse } from 'msw';
import { MOCK_CHANNELS, MOCK_MESSAGES, MOCK_USERS } from './data';
import type { Message } from '@/features/message/types';
import type { Channel } from '@/features/channel/types';

let channels = [...MOCK_CHANNELS];
let messages = [...MOCK_MESSAGES];
let messageIdCounter = messages.length + 1;
let channelIdCounter = channels.length + 1;

export const handlers = [
  // --- Users ---
  http.get('/api/users', () => {
    return HttpResponse.json(MOCK_USERS);
  }),

  http.get('/api/users/:id', ({ params }) => {
    const user = MOCK_USERS.find((u) => u.id === params['id']);
    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return HttpResponse.json(user);
  }),

  // --- Channels ---
  http.get('/api/channels', () => {
    return HttpResponse.json(channels);
  }),

  http.get('/api/channels/:id', ({ params }) => {
    const channel = channels.find((c) => c.id === params['id']);
    if (!channel) {
      return HttpResponse.json({ message: 'Channel not found' }, { status: 404 });
    }
    return HttpResponse.json(channel);
  }),

  http.post('/api/channels', async ({ request }) => {
    const body = (await request.json()) as Omit<Channel, 'id' | 'memberCount' | 'createdAt'>;
    const newChannel: Channel = {
      id: `channel-${channelIdCounter++}`,
      name: body.name,
      description: body.description,
      isPrivate: body.isPrivate,
      memberCount: 1,
      createdAt: new Date().toISOString(),
    };
    channels = [...channels, newChannel];
    return HttpResponse.json(newChannel, { status: 201 });
  }),

  // --- Messages ---
  http.get('/api/channels/:channelId/messages', ({ params }) => {
    const channelMessages = messages
      .filter((m) => m.channelId === params['channelId'])
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return HttpResponse.json(channelMessages);
  }),

  http.post('/api/channels/:channelId/messages', async ({ params, request }) => {
    const body = (await request.json()) as { content: string; userId: string };
    const newMessage: Message = {
      id: `msg-${messageIdCounter++}`,
      channelId: params['channelId'] as string,
      userId: body.userId,
      content: body.content,
      createdAt: new Date().toISOString(),
    };
    messages = [...messages, newMessage];
    return HttpResponse.json(newMessage, { status: 201 });
  }),
];
