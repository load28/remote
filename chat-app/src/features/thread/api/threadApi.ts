// A-06: httpClient 래퍼만 import
// A-05: 비즈니스 로직 없음 — 데이터 접근만

import { httpClient } from '@/shared/lib/httpClient';
import type {
  ThreadInfo,
  ThreadReply,
  CreateThreadInput,
  ReplyToThreadInput,
  LockThreadInput,
  ReadPosition,
  UnreadCount,
  MarkAsReadInput,
  MarkThreadAsReadInput,
} from '../types';

export const threadApi = {
  getByChannel: (channelId: string, signal?: AbortSignal): Promise<ThreadInfo[]> =>
    httpClient.get(`/api/channels/${channelId}/threads`, { signal }),

  getById: (threadId: string, signal?: AbortSignal): Promise<ThreadInfo> =>
    httpClient.get(`/api/threads/${threadId}`, { signal }),

  getReplies: (threadId: string, signal?: AbortSignal): Promise<ThreadReply[]> =>
    httpClient.get(`/api/threads/${threadId}/replies`, { signal }),

  create: (input: CreateThreadInput, userId: string): Promise<ThreadInfo> =>
    httpClient.post('/api/threads', { ...input, userId }),

  reply: (input: ReplyToThreadInput, userId: string): Promise<ThreadReply> =>
    httpClient.post(`/api/threads/${input.threadId}/replies`, { content: input.content, userId }),

  lock: (input: LockThreadInput, userId: string): Promise<ThreadInfo> =>
    httpClient.post(`/api/threads/${input.threadId}/lock`, { reason: input.reason, userId }),

  unlock: (threadId: string, userId: string): Promise<ThreadInfo> =>
    httpClient.post(`/api/threads/${threadId}/unlock`, { userId }),
};

export const readTrackingApi = {
  getReadPosition: (channelId: string, userId: string, signal?: AbortSignal): Promise<ReadPosition> =>
    httpClient.get(`/api/channels/${channelId}/read-position`, { params: { userId }, signal }),

  getUnreadCounts: (userId: string, signal?: AbortSignal): Promise<UnreadCount[]> =>
    httpClient.get('/api/unread-counts', { params: { userId }, signal }),

  markAsRead: (input: MarkAsReadInput, userId: string): Promise<ReadPosition> =>
    httpClient.post('/api/read-position', { ...input, userId }),

  markThreadAsRead: (input: MarkThreadAsReadInput, userId: string): Promise<ReadPosition> =>
    httpClient.post('/api/thread-read-position', { ...input, userId }),
};
