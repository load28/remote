// A-07: barrel file — FSD: entities에서 re-export + feature 전용 export
// P-06: named export만

// entities/thread에서 re-export (도메인 모델)
export {
  ThreadReplyItem,
  ThreadIndicator,
  UnreadBadge,
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
  activeThreadIdAtom,
  isThreadPanelOpenAtom,
  openThreadAtom,
  closeThreadAtom,
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
  THREAD_QUERY_KEY,
  THREAD_REPLIES_QUERY_KEY,
  READ_POSITION_QUERY_KEY,
  UNREAD_COUNTS_QUERY_KEY,
} from '@/entities/thread';

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
} from '@/entities/thread';

// feature 전용 (사용자 인터랙션)
export { ThreadPanel, type ThreadParentInfo, type ThreadPermissions, type ThreadPanelActions } from './components/ThreadPanel';
