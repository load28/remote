// A-05: 비즈니스 로직 분리 — ChatPage에서 스레드 관련 로직 추출
// N-05: use + 동사

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useChannelThreads,
  useThreadReplies,
  useCreateThread,
  useReplyToThread,
  useLockThread,
  useUnlockThread,
  useMarkThreadAsRead,
  useThreadStore,
  canReplyToThread,
  canLockThread,
  canUnlockThread,
  THREAD_QUERY_KEY,
  THREAD_REPLIES_QUERY_KEY,
  UNREAD_COUNTS_QUERY_KEY,
} from '@/features/thread';
import { MESSAGE_QUERY_KEY } from '@/features/message';
import type { ThreadInfo } from '@/features/thread';
import type { Message } from '@/features/message';

// ✅ T-13: named exported interface
export interface ChatThreadState {
  activeThreadId: string | null;
  isThreadPanelOpen: boolean;
  isPendingThread: boolean;
  channelThreads: ThreadInfo[];
  threadReplies: { id: string; threadId: string; userId: string; content: string; createdAt: string }[];
  activeThread: ThreadInfo | undefined;
  replyPermission: { allowed: boolean; reason: string };
  hasLockPermission: boolean;
  hasUnlockPermission: boolean;
  isReplying: boolean;
  isCreatingThread: boolean;
}

export interface ChatThreadActions {
  handleStartThread: (messageId: string) => void;
  handleReplyToThread: (content: string) => void;
  handleLockThread: (reason: string) => void;
  handleUnlockThread: () => void;
  handleCloseThread: () => void;
  getParentMessage: (messages: Message[]) => Message | undefined;
  getPendingMessage: (messages: Message[]) => Message | undefined;
}

export function useChatThread(channelId: string, userId: string): ChatThreadState & ChatThreadActions {
  const queryClient = useQueryClient();

  const activeThreadId = useThreadStore((s) => s.activeThreadId);
  const isThreadPanelOpen = useThreadStore((s) => s.isThreadPanelOpen);
  const openThread = useThreadStore((s) => s.openThread);
  const closeThread = useThreadStore((s) => s.closeThread);

  const { data: channelThreads = [] } = useChannelThreads(channelId);
  const { data: threadReplies = [] } = useThreadReplies(activeThreadId ?? '');
  const createThread = useCreateThread(userId);
  const replyToThread = useReplyToThread(userId);
  const lockThread = useLockThread(userId);
  const unlockThread = useUnlockThread(userId);
  const markThreadAsRead = useMarkThreadAsRead(userId);

  const activeThread = channelThreads.find((t) => t.id === activeThreadId);
  const isPendingThread = activeThreadId?.startsWith('pending-') ?? false;

  const replyPermission = activeThread
    ? canReplyToThread(activeThread, userId)
    : { allowed: false, reason: '' };
  const hasLockPermission = activeThread ? canLockThread(activeThread, userId) : false;
  const hasUnlockPermission = activeThread ? canUnlockThread(activeThread, userId) : false;

  const handleStartThread = useCallback((messageId: string) => {
    const existingThread = channelThreads.find((t) => t.parentMessageId === messageId);
    if (existingThread) {
      openThread(existingThread.id);
      return;
    }
    openThread(`pending-${messageId}`);
  }, [channelThreads, openThread]);

  const handleReplyToThread = useCallback((content: string) => {
    if (!activeThreadId) return;

    if (activeThreadId.startsWith('pending-')) {
      const messageId = activeThreadId.replace('pending-', '');
      createThread.mutate(
        { parentMessageId: messageId, channelId, content },
        {
          onSuccess: (newThread) => {
            queryClient.invalidateQueries({ queryKey: [...THREAD_QUERY_KEY, channelId] });
            queryClient.invalidateQueries({ queryKey: [...MESSAGE_QUERY_KEY, channelId] });
            openThread(newThread.id);
          },
        },
      );
      return;
    }

    replyToThread.mutate(
      { threadId: activeThreadId, content },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [...THREAD_REPLIES_QUERY_KEY, activeThreadId] });
          queryClient.invalidateQueries({ queryKey: [...THREAD_QUERY_KEY, channelId] });
          const lastReply = threadReplies[threadReplies.length - 1];
          if (lastReply) {
            markThreadAsRead.mutate(
              { threadId: activeThreadId, replyId: lastReply.id },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_QUERY_KEY });
                },
              },
            );
          }
        },
      },
    );
  }, [activeThreadId, channelId, createThread, replyToThread, markThreadAsRead, threadReplies, queryClient, openThread]);

  const handleLockThread = useCallback((reason: string) => {
    if (!activeThreadId) return;
    lockThread.mutate(
      { threadId: activeThreadId, reason },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [...THREAD_QUERY_KEY, channelId] });
        },
      },
    );
  }, [activeThreadId, channelId, lockThread, queryClient]);

  const handleUnlockThread = useCallback(() => {
    if (!activeThreadId) return;
    unlockThread.mutate(activeThreadId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [...THREAD_QUERY_KEY, channelId] });
      },
    });
  }, [activeThreadId, channelId, unlockThread, queryClient]);

  const handleCloseThread = useCallback(() => {
    closeThread();
  }, [closeThread]);

  const getParentMessage = useCallback((messages: Message[]) => {
    if (!activeThread) return undefined;
    return messages.find((m) => m.id === activeThread.parentMessageId);
  }, [activeThread]);

  const getPendingMessage = useCallback((messages: Message[]) => {
    if (!isPendingThread || !activeThreadId) return undefined;
    const messageId = activeThreadId.replace('pending-', '');
    return messages.find((m) => m.id === messageId);
  }, [isPendingThread, activeThreadId]);

  return {
    activeThreadId,
    isThreadPanelOpen,
    isPendingThread,
    channelThreads,
    threadReplies,
    activeThread,
    replyPermission,
    hasLockPermission,
    hasUnlockPermission,
    isReplying: replyToThread.isPending,
    isCreatingThread: createThread.isPending,
    handleStartThread,
    handleReplyToThread,
    handleLockThread,
    handleUnlockThread,
    handleCloseThread,
    getParentMessage,
    getPendingMessage,
  };
}
