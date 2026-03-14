// A-07: barrel file public API만 노출, P-06: named export만

// Components
export { ThreadPanel, type ThreadAuthor } from './components/ThreadPanel';
export { ThreadIndicator } from './components/ThreadIndicator';
export { ThreadReplyItem } from './components/ThreadReplyItem';
export { UnreadBadge } from './components/UnreadBadge';

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
} from './hooks/useThread';

export { useThreadStore } from './hooks/useThreadStore';

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
} from './domain/threadRules';

// Types
export type {
  ThreadInfo,
  ThreadReply,
  ThreadSummary,
  ThreadStatus,
  CreateThreadInput,
  ReplyToThreadInput,
  LockThreadInput,
  ReadPosition,
  UnreadCount,
  MarkAsReadInput,
  MarkThreadAsReadInput,
} from './types';
