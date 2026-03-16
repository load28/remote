// S-04: TanStack Query 사용, S-17: mutation 훅 onSuccess 내장 금지
// N-05: use + 동사, P-13: signal abort

import { useQuery, useMutation } from '@tanstack/react-query';
import { threadApi, readTrackingApi } from '../api/threadApi';

// P-03: 모듈 레벨 상수
export const THREAD_QUERY_KEY = ['threads'] as const;
export const THREAD_REPLIES_QUERY_KEY = ['thread-replies'] as const;
export const READ_POSITION_QUERY_KEY = ['read-position'] as const;
export const UNREAD_COUNTS_QUERY_KEY = ['unread-counts'] as const;

// --- Thread 쿼리 ---

export function useChannelThreads(channelId: string) {
  return useQuery({
    queryKey: [...THREAD_QUERY_KEY, channelId],
    queryFn: ({ signal }) => threadApi.getByChannel(channelId, signal),
    enabled: !!channelId,
  });
}

export function useThreadDetail(threadId: string) {
  return useQuery({
    queryKey: [...THREAD_QUERY_KEY, 'detail', threadId],
    queryFn: ({ signal }) => threadApi.getById(threadId, signal),
    enabled: !!threadId,
  });
}

export function useThreadReplies(threadId: string) {
  return useQuery({
    queryKey: [...THREAD_REPLIES_QUERY_KEY, threadId],
    queryFn: ({ signal }) => threadApi.getReplies(threadId, signal),
    enabled: !!threadId,
  });
}

// --- Thread 뮤테이션 ---

// S-17: mutationFn만 정의, onSuccess는 사용처에서
export function useCreateThread(userId: string) {
  return useMutation({
    mutationFn: (input: { parentMessageId: string; channelId: string; content: string }) =>
      threadApi.create(input, userId),
  });
}

export function useReplyToThread(userId: string) {
  return useMutation({
    mutationFn: (input: { threadId: string; content: string }) =>
      threadApi.reply(input, userId),
  });
}

export function useLockThread(userId: string) {
  return useMutation({
    mutationFn: (input: { threadId: string; reason: string }) =>
      threadApi.lock(input, userId),
  });
}

export function useUnlockThread(userId: string) {
  return useMutation({
    mutationFn: (threadId: string) =>
      threadApi.unlock(threadId, userId),
  });
}

// --- 읽음 추적 쿼리/뮤테이션 ---

export function useUnreadCounts(userId: string) {
  return useQuery({
    queryKey: [...UNREAD_COUNTS_QUERY_KEY, userId],
    queryFn: ({ signal }) => readTrackingApi.getUnreadCounts(userId, signal),
    enabled: !!userId,
  });
}

export function useReadPosition(channelId: string, userId: string) {
  return useQuery({
    queryKey: [...READ_POSITION_QUERY_KEY, channelId, userId],
    queryFn: ({ signal }) => readTrackingApi.getReadPosition(channelId, userId, signal),
    enabled: !!channelId && !!userId,
  });
}

export function useMarkAsRead(userId: string) {
  return useMutation({
    mutationFn: (input: { channelId: string; messageId: string }) =>
      readTrackingApi.markAsRead(input, userId),
  });
}

export function useMarkThreadAsRead(userId: string) {
  return useMutation({
    mutationFn: (input: { threadId: string; replyId: string }) =>
      readTrackingApi.markThreadAsRead(input, userId),
  });
}
