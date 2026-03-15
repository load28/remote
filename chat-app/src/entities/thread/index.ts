// A-07: barrel file public API만 노출, P-06: named export만

// UI Components
export { ThreadReplyItem } from './ui/ThreadReplyItem';
export type { ThreadReplyItemProps } from './ui/ThreadReplyItem';
export { ThreadIndicator } from './ui/ThreadIndicator';
export type { ThreadIndicatorProps } from './ui/ThreadIndicator';
export { UnreadBadge } from './ui/UnreadBadge';
export type { UnreadBadgeProps } from './ui/UnreadBadge';

// Hooks
export {
  useChannelThreads,
  useThreadDetail,
  useThreadReplies,
  useCreateThread,
  useReplyToThread,
  useLockThread,
  useUnlockThread,
  useUnreadCounts,
  useReadPosition,
  useMarkAsRead,
  useMarkThreadAsRead,
  THREAD_QUERY_KEY,
  THREAD_REPLIES_QUERY_KEY,
  READ_POSITION_QUERY_KEY,
  UNREAD_COUNTS_QUERY_KEY,
} from './model/useThread';

export { useThreadStore } from './model/useThreadStore';
export type { ThreadStoreState, ThreadStoreActions } from './model/useThreadStore';

// Domain
export {
  canReplyToThread,
  canLockThread,
  canUnlockThread,
  shouldAutoLock,
  calculateUnreadReplies,
  calculateChannelUnreadCount,
  buildThreadSummary,
  extractMentions,
  getThreadParticipants,
  canTransitionStatus,
  isRateLimited,
  sortThreadsByLastReply,
  filterActiveThreads,
} from './model/threadRules';

// Types
export type {
  ThreadInfo,
  ThreadReply,
  ThreadSummary,
  ThreadStatus,
  ThreadAuthor,
  CreateThreadInput,
  ReplyToThreadInput,
  LockThreadInput,
  ReadPosition,
  UnreadCount,
  MarkAsReadInput,
  MarkThreadAsReadInput,
} from './model/types';
