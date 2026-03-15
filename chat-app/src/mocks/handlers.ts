import { http, HttpResponse } from 'msw';
import { MOCK_CHANNELS, MOCK_CHANNEL_MEMBERS, MOCK_MESSAGES, MOCK_USERS, MOCK_WORKSPACES } from './data';
import { MOCK_RECENT_USERS } from './recentUsers';
import type { Message } from '@/features/message/types';
import type { Channel, ChannelMember, ChannelMemberRole, AddChannelMemberInput, UpdateMemberRoleInput } from '@/features/channel/types';
import type { LoginCredentials } from '@/features/auth/types';
import type { User, UpdateProfileInput } from '@/features/user/types';
import type { CustomEmoji } from '@/features/emoji/types';
import type { InviteLink, GuestJoinInput } from '@/features/invite/types';
import type { ThreadInfo, ThreadReply, ReadPosition, UnreadCount } from '@/features/thread/types';
import type { Plan, PlanItem } from '@/features/plan/types';
import type { Notification } from '@/features/notification/types';

// ✅ P-03: 모듈 레벨 상수
const MOCK_PASSWORD = 'password';
const INVITE_EXPIRY_HOURS = 24;
const MAX_REPLIES_PER_THREAD = 100;
const THREAD_AUTO_LOCK_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

let users = [...MOCK_USERS];
let channels = [...MOCK_CHANNELS];
let channelMembers = [...MOCK_CHANNEL_MEMBERS];
let messages = [...MOCK_MESSAGES];
let customEmojis: CustomEmoji[] = [];
let inviteLinks: InviteLink[] = [];
let threads: ThreadInfo[] = [];
let threadReplies: ThreadReply[] = [];
let readPositions: ReadPosition[] = [];
let messageIdCounter = messages.length + 1;
let channelIdCounter = channels.length + 1;
let customEmojiIdCounter = 1;
let inviteIdCounter = 1;
let guestIdCounter = 1;
let threadIdCounter = 1;
let threadReplyIdCounter = 1;
let plans: Plan[] = [];
let planIdCounter = 1;
let planItemIdCounter = 1;
let notifications: Notification[] = [
  {
    type: 'message',
    id: 'notif-1',
    channelId: 'channel-1',
    channelName: 'general',
    senderName: 'Alice',
    preview: '안녕하세요! 새로운 프로젝트 관련 공유드립니다.',
    isRead: false,
    createdAt: '2026-03-16T09:00:00.000Z',
  },
  {
    type: 'mention',
    id: 'notif-2',
    channelId: 'channel-1',
    channelName: 'general',
    senderName: 'Bob',
    preview: '@user-1 이 이슈 확인 부탁드려요',
    isRead: false,
    createdAt: '2026-03-16T09:15:00.000Z',
  },
  {
    type: 'thread_reply',
    id: 'notif-3',
    channelId: 'channel-2',
    threadId: 'thread-1',
    senderName: 'Charlie',
    preview: '그 방법 좋은 것 같습니다!',
    isRead: false,
    createdAt: '2026-03-16T09:30:00.000Z',
  },
  {
    type: 'channel_invite',
    id: 'notif-4',
    channelId: 'channel-3',
    channelName: 'design-review',
    inviterName: 'Diana',
    isRead: true,
    createdAt: '2026-03-16T08:00:00.000Z',
  },
  {
    type: 'mention',
    id: 'notif-5',
    channelId: 'channel-2',
    channelName: 'dev-team',
    senderName: 'Eve',
    preview: '@user-1 PR 리뷰 부탁드립니다',
    isRead: false,
    createdAt: '2026-03-16T10:00:00.000Z',
  },
  {
    type: 'thread_reply',
    id: 'notif-6',
    channelId: 'channel-1',
    threadId: 'thread-2',
    senderName: 'Frank',
    preview: '배포 일정 확정되었습니다',
    isRead: true,
    createdAt: '2026-03-16T07:30:00.000Z',
  },
];

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

  // --- Channel Members ---
  http.get('/api/channels/:channelId/members', ({ params }) => {
    const filtered = channelMembers.filter((m) => m.channelId === params['channelId']);
    return HttpResponse.json(filtered);
  }),

  http.post('/api/channels/:channelId/members', async ({ params, request }) => {
    const channelId = params['channelId'] as string;
    const body = (await request.json()) as AddChannelMemberInput;
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) {
      return HttpResponse.json({ message: 'Channel not found' }, { status: 404 });
    }

    const existingMember = channelMembers.find(
      (m) => m.channelId === channelId && m.userId === body.userId,
    );
    if (existingMember) {
      return HttpResponse.json({ message: 'User already a member' }, { status: 409 });
    }

    const user = users.find((u) => u.id === body.userId);
    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const newMember: ChannelMember = {
      channelId,
      userId: body.userId,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isOnline: user.isOnline,
      role: body.role,
      joinedAt: new Date().toISOString(),
    };
    channelMembers = [...channelMembers, newMember];

    // memberCount 업데이트
    channels = channels.map((c) =>
      c.id === channelId ? { ...c, memberCount: c.memberCount + 1 } : c,
    );

    return HttpResponse.json(newMember, { status: 201 });
  }),

  http.delete('/api/channels/:channelId/members/:userId', ({ params }) => {
    const channelId = params['channelId'] as string;
    const userId = params['userId'] as string;

    const member = channelMembers.find(
      (m) => m.channelId === channelId && m.userId === userId,
    );
    if (!member) {
      return HttpResponse.json({ message: 'Member not found' }, { status: 404 });
    }
    if (member.role === 'owner') {
      return HttpResponse.json({ message: 'Cannot remove channel owner' }, { status: 403 });
    }

    channelMembers = channelMembers.filter(
      (m) => !(m.channelId === channelId && m.userId === userId),
    );
    channels = channels.map((c) =>
      c.id === channelId ? { ...c, memberCount: Math.max(0, c.memberCount - 1) } : c,
    );

    return new HttpResponse(null, { status: 204 });
  }),

  http.put('/api/channels/:channelId/members/:userId/role', async ({ params, request }) => {
    const channelId = params['channelId'] as string;
    const userId = params['userId'] as string;
    const body = (await request.json()) as UpdateMemberRoleInput;

    const memberIndex = channelMembers.findIndex(
      (m) => m.channelId === channelId && m.userId === userId,
    );
    if (memberIndex === -1) {
      return HttpResponse.json({ message: 'Member not found' }, { status: 404 });
    }

    const member = channelMembers[memberIndex];
    if (member.role === 'owner') {
      return HttpResponse.json({ message: 'Cannot change owner role' }, { status: 403 });
    }

    const updatedMember: ChannelMember = { ...member, role: body.role };
    channelMembers = channelMembers.map((m, i) => (i === memberIndex ? updatedMember : m));

    return HttpResponse.json(updatedMember);
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
      threadId: '',
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

  // --- Threads ---
  http.get('/api/channels/:channelId/threads', ({ params }) => {
    const channelThreads = threads
      .filter((t) => t.channelId === params['channelId'])
      .sort((a, b) => new Date(b.lastReplyAt).getTime() - new Date(a.lastReplyAt).getTime());
    return HttpResponse.json(channelThreads);
  }),

  http.get('/api/threads/:threadId', ({ params }) => {
    const thread = threads.find((t) => t.id === params['threadId']);
    if (!thread) {
      return HttpResponse.json({ message: 'Thread not found' }, { status: 404 });
    }
    return HttpResponse.json(thread);
  }),

  http.get('/api/threads/:threadId/replies', ({ params }) => {
    const replies = threadReplies
      .filter((r) => r.threadId === params['threadId'])
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return HttpResponse.json(replies);
  }),

  http.post('/api/threads', async ({ request }) => {
    const body = (await request.json()) as {
      parentMessageId: string;
      channelId: string;
      content: string;
      userId: string;
    };

    // 동일 메시지에 이미 스레드가 있는지 확인
    const existingThread = threads.find((t) => t.parentMessageId === body.parentMessageId);
    if (existingThread) {
      return HttpResponse.json({ message: 'Thread already exists for this message' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const newThread: ThreadInfo = {
      id: `thread-${threadIdCounter++}`,
      parentMessageId: body.parentMessageId,
      channelId: body.channelId,
      createdBy: body.userId,
      createdAt: now,
      lastReplyAt: now,
      replyCount: 1,
      status: { type: 'active', lastActivityAt: now },
    };
    threads = [...threads, newThread];

    // 첫 번째 답장 생성
    const firstReply: ThreadReply = {
      id: `treply-${threadReplyIdCounter++}`,
      threadId: newThread.id,
      userId: body.userId,
      content: body.content,
      createdAt: now,
    };
    threadReplies = [...threadReplies, firstReply];

    return HttpResponse.json(newThread, { status: 201 });
  }),

  http.post('/api/threads/:threadId/replies', async ({ params, request }) => {
    const body = (await request.json()) as { content: string; userId: string };
    const threadId = params['threadId'] as string;
    const thread = threads.find((t) => t.id === threadId);

    if (!thread) {
      return HttpResponse.json({ message: 'Thread not found' }, { status: 404 });
    }

    // 비즈니스 로직: 잠긴 스레드 답장 불가
    if (thread.status.type === 'locked') {
      return HttpResponse.json({ message: 'Thread is locked' }, { status: 403 });
    }

    // 비즈니스 로직: 보관된 스레드 답장 불가
    if (thread.status.type === 'archived') {
      return HttpResponse.json({ message: 'Thread is archived' }, { status: 403 });
    }

    // 비즈니스 로직: 최대 답장 수 제한
    if (thread.replyCount >= MAX_REPLIES_PER_THREAD) {
      return HttpResponse.json({ message: 'Maximum replies reached' }, { status: 422 });
    }

    // 비즈니스 로직: 자동 잠금 (7일 비활성)
    const daysSinceLastReply = (Date.now() - new Date(thread.lastReplyAt).getTime()) / MS_PER_DAY;
    if (daysSinceLastReply > THREAD_AUTO_LOCK_DAYS) {
      const lockTime = new Date().toISOString();
      threads = threads.map((t) =>
        t.id === threadId
          ? { ...t, status: { type: 'locked' as const, lockedBy: 'system', lockedAt: lockTime, reason: '7일 이상 비활성으로 자동 잠금' } }
          : t,
      );
      return HttpResponse.json({ message: 'Thread auto-locked due to inactivity' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const newReply: ThreadReply = {
      id: `treply-${threadReplyIdCounter++}`,
      threadId,
      userId: body.userId,
      content: body.content,
      createdAt: now,
    };
    threadReplies = [...threadReplies, newReply];

    // 스레드 업데이트
    threads = threads.map((t) =>
      t.id === threadId
        ? { ...t, lastReplyAt: now, replyCount: t.replyCount + 1, status: { type: 'active' as const, lastActivityAt: now } }
        : t,
    );

    return HttpResponse.json(newReply, { status: 201 });
  }),

  http.post('/api/threads/:threadId/lock', async ({ params, request }) => {
    const body = (await request.json()) as { reason: string; userId: string };
    const threadId = params['threadId'] as string;
    const thread = threads.find((t) => t.id === threadId);

    if (!thread) {
      return HttpResponse.json({ message: 'Thread not found' }, { status: 404 });
    }

    // 비즈니스 로직: 스레드 생성자만 잠금 가능
    if (thread.createdBy !== body.userId) {
      return HttpResponse.json({ message: 'Only thread creator can lock' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const updatedThread: ThreadInfo = {
      ...thread,
      status: { type: 'locked', lockedBy: body.userId, lockedAt: now, reason: body.reason },
    };
    threads = threads.map((t) => (t.id === threadId ? updatedThread : t));
    return HttpResponse.json(updatedThread);
  }),

  http.post('/api/threads/:threadId/unlock', async ({ params, request }) => {
    const body = (await request.json()) as { userId: string };
    const threadId = params['threadId'] as string;
    const thread = threads.find((t) => t.id === threadId);

    if (!thread) {
      return HttpResponse.json({ message: 'Thread not found' }, { status: 404 });
    }

    if (thread.status.type !== 'locked') {
      return HttpResponse.json({ message: 'Thread is not locked' }, { status: 422 });
    }

    // 비즈니스 로직: 생성자 또는 잠근 사람만 해제 가능
    if (thread.createdBy !== body.userId && thread.status.lockedBy !== body.userId) {
      return HttpResponse.json({ message: 'Not authorized to unlock' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const updatedThread: ThreadInfo = {
      ...thread,
      status: { type: 'active', lastActivityAt: now },
    };
    threads = threads.map((t) => (t.id === threadId ? updatedThread : t));
    return HttpResponse.json(updatedThread);
  }),

  // --- Read Tracking ---
  http.get('/api/channels/:channelId/read-position', ({ params, request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') ?? '';
    const channelId = params['channelId'] as string;

    const position = readPositions.find(
      (rp) => rp.channelId === channelId && rp.userId === userId,
    );

    if (position) {
      return HttpResponse.json(position);
    }

    // 기본 읽음 위치 반환
    const defaultPosition: ReadPosition = {
      userId,
      channelId,
      lastReadMessageId: '',
      lastReadAt: new Date().toISOString(),
      threadPositions: {},
    };
    return HttpResponse.json(defaultPosition);
  }),

  http.get('/api/unread-counts', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') ?? '';

    const counts: UnreadCount[] = channels.map((channel) => {
      const channelMessages = messages.filter((m) => m.channelId === channel.id);
      const position = readPositions.find(
        (rp) => rp.channelId === channel.id && rp.userId === userId,
      );

      let messageCount = 0;
      if (!position || position.lastReadMessageId === '') {
        messageCount = channelMessages.length;
      } else {
        const lastReadIndex = channelMessages.findIndex(
          (m) => m.id === position.lastReadMessageId,
        );
        if (lastReadIndex === -1) {
          messageCount = channelMessages.length;
        } else {
          messageCount = channelMessages.length - lastReadIndex - 1;
        }
      }

      const channelThreads = threads.filter((t) => t.channelId === channel.id);
      let threadUnreadCount = 0;
      for (const thread of channelThreads) {
        const lastReadReplyId = position?.threadPositions[thread.id] ?? '';
        const replies = threadReplies.filter((r) => r.threadId === thread.id);
        if (lastReadReplyId === '') {
          threadUnreadCount += replies.length;
        } else {
          const idx = replies.findIndex((r) => r.id === lastReadReplyId);
          if (idx === -1) {
            threadUnreadCount += replies.length;
          } else {
            threadUnreadCount += replies.length - idx - 1;
          }
        }
      }

      return {
        channelId: channel.id,
        messageCount,
        threadCount: threadUnreadCount,
        mentionCount: 0,
      };
    });

    return HttpResponse.json(counts);
  }),

  http.post('/api/read-position', async ({ request }) => {
    const body = (await request.json()) as { channelId: string; messageId: string; userId: string };
    const now = new Date().toISOString();

    const existingIndex = readPositions.findIndex(
      (rp) => rp.channelId === body.channelId && rp.userId === body.userId,
    );

    const updatedPosition: ReadPosition = {
      userId: body.userId,
      channelId: body.channelId,
      lastReadMessageId: body.messageId,
      lastReadAt: now,
      threadPositions: existingIndex !== -1 ? readPositions[existingIndex].threadPositions : {},
    };

    if (existingIndex !== -1) {
      readPositions = readPositions.map((rp, i) => (i === existingIndex ? updatedPosition : rp));
    } else {
      readPositions = [...readPositions, updatedPosition];
    }

    return HttpResponse.json(updatedPosition);
  }),

  http.post('/api/thread-read-position', async ({ request }) => {
    const body = (await request.json()) as { threadId: string; replyId: string; userId: string };
    const thread = threads.find((t) => t.id === body.threadId);
    if (!thread) {
      return HttpResponse.json({ message: 'Thread not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const existingIndex = readPositions.findIndex(
      (rp) => rp.channelId === thread.channelId && rp.userId === body.userId,
    );

    if (existingIndex !== -1) {
      const existing = readPositions[existingIndex];
      const updatedPosition: ReadPosition = {
        ...existing,
        lastReadAt: now,
        threadPositions: { ...existing.threadPositions, [body.threadId]: body.replyId },
      };
      readPositions = readPositions.map((rp, i) => (i === existingIndex ? updatedPosition : rp));
      return HttpResponse.json(updatedPosition);
    }

    const newPosition: ReadPosition = {
      userId: body.userId,
      channelId: thread.channelId,
      lastReadMessageId: '',
      lastReadAt: now,
      threadPositions: { [body.threadId]: body.replyId },
    };
    readPositions = [...readPositions, newPosition];
    return HttpResponse.json(newPosition);
  }),

  // --- Plans ---
  http.get('/api/channels/:channelId/plans', ({ params }) => {
    const channelPlans = plans
      .filter((p) => p.channelId === params['channelId'])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return HttpResponse.json(channelPlans);
  }),

  http.get('/api/plans/:planId', ({ params }) => {
    const foundPlan = plans.find((p) => p.id === params['planId']);
    if (!foundPlan) {
      return HttpResponse.json({ message: 'Plan not found' }, { status: 404 });
    }
    return HttpResponse.json(foundPlan);
  }),

  http.post('/api/plans', async ({ request }) => {
    const body = (await request.json()) as { channelId: string; title: string; userId: string };
    const now = new Date().toISOString();
    const newPlan: Plan = {
      id: `plan-${planIdCounter++}`,
      channelId: body.channelId,
      title: body.title,
      createdBy: body.userId,
      createdAt: now,
      items: [],
    };
    plans = [...plans, newPlan];
    return HttpResponse.json(newPlan, { status: 201 });
  }),

  http.post('/api/plans/:planId/items', async ({ params, request }) => {
    const body = (await request.json()) as { content: string; userId: string };
    const planId = params['planId'] as string;
    const foundPlan = plans.find((p) => p.id === planId);
    if (!foundPlan) {
      return HttpResponse.json({ message: 'Plan not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const newItem: PlanItem = {
      id: `plan-item-${planItemIdCounter++}`,
      planId,
      content: body.content,
      isCompleted: false,
      createdAt: now,
    };
    plans = plans.map((p) =>
      p.id === planId ? { ...p, items: [...p.items, newItem] } : p,
    );
    return HttpResponse.json(newItem, { status: 201 });
  }),

  http.post('/api/plans/:planId/items/:itemId/toggle', ({ params }) => {
    const planId = params['planId'] as string;
    const itemId = params['itemId'] as string;
    const foundPlan = plans.find((p) => p.id === planId);
    if (!foundPlan) {
      return HttpResponse.json({ message: 'Plan not found' }, { status: 404 });
    }

    const targetItem = foundPlan.items.find((i) => i.id === itemId);
    if (!targetItem) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const toggledItem: PlanItem = { ...targetItem, isCompleted: !targetItem.isCompleted };
    plans = plans.map((p) =>
      p.id === planId
        ? { ...p, items: p.items.map((i) => (i.id === itemId ? toggledItem : i)) }
        : p,
    );
    return HttpResponse.json(toggledItem);
  }),

  http.delete('/api/plans/:planId/items/:itemId', ({ params }) => {
    const planId = params['planId'] as string;
    const itemId = params['itemId'] as string;
    const foundPlan = plans.find((p) => p.id === planId);
    if (!foundPlan) {
      return HttpResponse.json({ message: 'Plan not found' }, { status: 404 });
    }

    plans = plans.map((p) =>
      p.id === planId ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : p,
    );
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete('/api/plans/:planId', ({ params }) => {
    const planId = params['planId'] as string;
    const foundPlan = plans.find((p) => p.id === planId);
    if (!foundPlan) {
      return HttpResponse.json({ message: 'Plan not found' }, { status: 404 });
    }
    plans = plans.filter((p) => p.id !== planId);
    return new HttpResponse(null, { status: 204 });
  }),

  // --- Notifications ---
  http.get('/api/notifications', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') ?? '';
    // user-1 기준 모킹 데이터 반환
    if (userId) {
      return HttpResponse.json(notifications);
    }
    return HttpResponse.json([]);
  }),

  http.put('/api/notifications/:id/read', ({ params }) => {
    const notifId = params['id'] as string;
    const notifIndex = notifications.findIndex((n) => n.id === notifId);
    if (notifIndex === -1) {
      return HttpResponse.json({ message: 'Notification not found' }, { status: 404 });
    }

    const updated: Notification = { ...notifications[notifIndex], isRead: true };
    notifications = notifications.map((n, i) => (i === notifIndex ? updated : n));
    return HttpResponse.json(updated);
  }),

  http.put('/api/notifications/read-all', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') ?? '';
    if (!userId) {
      return HttpResponse.json({ message: 'userId required' }, { status: 400 });
    }

    notifications = notifications.map((n) => ({ ...n, isRead: true }));
    return new HttpResponse(null, { status: 204 });
  }),
];
