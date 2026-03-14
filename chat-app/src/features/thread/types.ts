// T-13: named exported interface
// T-14: discriminated union for ThreadStatus
// T-15: optional 남용 금지 — 조건부 프로퍼티는 타입 분리

// --- Thread 기본 타입 ---

export interface ThreadReply {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface ThreadSummary {
  threadId: string;
  lastReplyContent: string;
  lastReplyUserId: string;
  lastReplyAt: string;
  replyCount: number;
  unreadReplyCount: number;
}

// ✅ T-14: ThreadStatus discriminated union — 상태별 프로퍼티가 다름
export type ThreadStatus =
  | { type: 'active'; lastActivityAt: string }
  | { type: 'locked'; lockedBy: string; lockedAt: string; reason: string }
  | { type: 'archived'; archivedAt: string };

// ✅ T-15: isLocked은 ThreadStatus로 분리, optional 미사용
export interface ThreadInfo {
  id: string;
  parentMessageId: string;
  channelId: string;
  createdBy: string;
  createdAt: string;
  lastReplyAt: string;
  replyCount: number;
  status: ThreadStatus;
}

// --- Thread 입력 타입 ---

export interface CreateThreadInput {
  parentMessageId: string;
  channelId: string;
  content: string;
}

export interface ReplyToThreadInput {
  threadId: string;
  content: string;
}

export interface LockThreadInput {
  threadId: string;
  reason: string;
}

// --- 읽음 추적 타입 ---

export interface ReadPosition {
  userId: string;
  channelId: string;
  lastReadMessageId: string;
  lastReadAt: string;
  threadPositions: Record<string, string>;
}

export interface UnreadCount {
  channelId: string;
  messageCount: number;
  threadCount: number;
  mentionCount: number;
}

export interface MarkAsReadInput {
  channelId: string;
  messageId: string;
}

export interface MarkThreadAsReadInput {
  threadId: string;
  replyId: string;
}
