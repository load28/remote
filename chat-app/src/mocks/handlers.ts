import { http, HttpResponse } from 'msw';
import { MOCK_CHANNELS, MOCK_MESSAGES, MOCK_USERS, MOCK_WORKSPACES } from './data';
import { MOCK_RECENT_USERS } from './recentUsers';
import type { Message } from '@/features/message/types';
import type { Channel } from '@/features/channel/types';
import type { LoginCredentials } from '@/features/auth/types';
import type { User, UpdateProfileInput } from '@/features/user/types';
import type { CustomEmoji } from '@/features/emoji/types';
import type { InviteLink, GuestJoinInput } from '@/features/invite/types';

// ✅ P-03: 모듈 레벨 상수
const MOCK_PASSWORD = 'password';
const INVITE_EXPIRY_HOURS = 24;

let users = [...MOCK_USERS];
let channels = [...MOCK_CHANNELS];
let messages = [...MOCK_MESSAGES];
let customEmojis: CustomEmoji[] = [];
let inviteLinks: InviteLink[] = [];
let messageIdCounter = messages.length + 1;
let channelIdCounter = channels.length + 1;
let customEmojiIdCounter = 1;
let inviteIdCounter = 1;
let guestIdCounter = 1;

export const handlers = [
  // --- Workspaces ---
  http.get('/api/workspaces', () => {
    return HttpResponse.json(MOCK_WORKSPACES);
  }),

  // --- Auth ---
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginCredentials;
    const user = MOCK_USERS.find((u) => u.username === body.username);

    if (!user || body.password !== MOCK_PASSWORD) {
      return HttpResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      token: `mock-token-${user.id}`,
    });
  }),

  // --- App Config (P-07: 병렬 fetch 대상) ---
  http.get('/api/config', () => {
    return HttpResponse.json({
      appName: 'Chat App',
      version: '1.0.0',
      features: { registration: true },
    });
  }),

  // --- Recent Users (P-02: 50+ 가상화 리스트 대상) ---
  http.get('/api/auth/recent-users', () => {
    return HttpResponse.json(MOCK_RECENT_USERS);
  }),

  // --- Users ---
  http.get('/api/users', () => {
    return HttpResponse.json(users);
  }),

  http.get('/api/users/:id', ({ params }) => {
    const user = users.find((u) => u.id === params['id']);
    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return HttpResponse.json(user);
  }),

  http.put('/api/users/:id', async ({ params, request }) => {
    const body = (await request.json()) as UpdateProfileInput;
    const userIndex = users.findIndex((u) => u.id === params['id']);
    if (userIndex === -1) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const updatedUser: User = {
      ...users[userIndex],
      displayName: body.displayName,
      statusMessage: body.statusMessage,
      avatarUrl: body.avatarUrl,
    };
    users = users.map((u, i) => (i === userIndex ? updatedUser : u));
    return HttpResponse.json(updatedUser);
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
      workspaceId: body.workspaceId,
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

  // --- Custom Emojis ---
  http.get('/api/emojis/custom', () => {
    return HttpResponse.json(customEmojis);
  }),

  http.post('/api/emojis/custom', async ({ request }) => {
    const body = (await request.json()) as { name: string; imageUrl: string; createdBy: string };
    const newEmoji: CustomEmoji = {
      id: `emoji-${customEmojiIdCounter++}`,
      name: body.name,
      imageUrl: body.imageUrl,
      createdBy: body.createdBy,
    };
    customEmojis = [...customEmojis, newEmoji];
    return HttpResponse.json(newEmoji, { status: 201 });
  }),

  http.delete('/api/emojis/custom/:id', ({ params }) => {
    const emojiId = params['id'] as string;
    customEmojis = customEmojis.filter((e) => e.id !== emojiId);
    return new HttpResponse(null, { status: 204 });
  }),

  // --- Invite Links ---
  http.post('/api/invites', async ({ request }) => {
    const body = (await request.json()) as { channelId: string };
    const channel = channels.find((c) => c.id === body.channelId);
    if (!channel) {
      return HttpResponse.json({ message: 'Channel not found' }, { status: 404 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);
    const code = `${channel.name}-${Math.random().toString(36).substring(2, 8)}`;

    const newInvite: InviteLink = {
      id: `invite-${inviteIdCounter++}`,
      channelId: body.channelId,
      code,
      createdBy: 'current-user',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isActive: true,
    };
    inviteLinks = [...inviteLinks, newInvite];
    return HttpResponse.json(newInvite, { status: 201 });
  }),

  http.get('/api/invites/:code', ({ params }) => {
    const invite = inviteLinks.find((i) => i.code === params['code'] && i.isActive);
    if (!invite) {
      return HttpResponse.json({ message: 'Invalid or expired invite' }, { status: 404 });
    }

    const isExpired = new Date(invite.expiresAt).getTime() < Date.now();
    if (isExpired) {
      return HttpResponse.json({ message: 'Invite has expired' }, { status: 410 });
    }

    const channel = channels.find((c) => c.id === invite.channelId);
    return HttpResponse.json({ invite, channelName: channel?.name ?? '' });
  }),

  http.post('/api/invites/:code/join', async ({ params, request }) => {
    const body = (await request.json()) as GuestJoinInput;
    const invite = inviteLinks.find((i) => i.code === params['code'] && i.isActive);
    if (!invite) {
      return HttpResponse.json({ message: 'Invalid or expired invite' }, { status: 404 });
    }

    const isExpired = new Date(invite.expiresAt).getTime() < Date.now();
    if (isExpired) {
      return HttpResponse.json({ message: 'Invite has expired' }, { status: 410 });
    }

    const guestId = `guest-${guestIdCounter++}`;
    const guestUser: User = {
      id: guestId,
      username: `guest_${body.nickname.toLowerCase().replace(/\s+/g, '_')}`,
      displayName: `${body.nickname} (게스트)`,
      avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${guestId}`,
      statusMessage: '',
      isOnline: true,
    };
    users = [...users, guestUser];

    return HttpResponse.json({
      user: {
        id: guestUser.id,
        nickname: body.nickname,
        avatarUrl: guestUser.avatarUrl,
        isGuest: true,
      },
      token: `mock-token-${guestId}`,
      channelId: invite.channelId,
    });
  }),
];
