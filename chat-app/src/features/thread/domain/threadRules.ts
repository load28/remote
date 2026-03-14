// A-05: 비즈니스 로직 분리 — React 미사용 순수 함수
// P-03: 모듈 레벨 상수

import type { ThreadInfo, ThreadStatus, ThreadReply, ThreadSummary, UnreadCount, ReadPosition } from '../types';

// ✅ P-03: 모듈 레벨 상수
const MAX_REPLIES_PER_THREAD = 100;
const THREAD_AUTO_LOCK_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MENTION_PATTERN = /@(\w+)/g;

// --- 스레드 상태 판별 ---

export function isThreadActive(status: ThreadStatus): boolean {
  return status.type === 'active';
}

export function isThreadLocked(status: ThreadStatus): boolean {
  return status.type === 'locked';
}

export function isThreadArchived(status: ThreadStatus): boolean {
  return status.type === 'archived';
}

// --- 스레드 생성/답장 가능 여부 ---

export function canReplyToThread(thread: ThreadInfo, userId: string): { allowed: boolean; reason: string } {
  if (thread.status.type === 'archived') {
    return { allowed: false, reason: '보관된 스레드에는 답장할 수 없습니다.' };
  }

  if (thread.status.type === 'locked') {
    return { allowed: false, reason: `이 스레드는 ${thread.status.lockedBy}에 의해 잠겼습니다: ${thread.status.reason}` };
  }

  if (thread.replyCount >= MAX_REPLIES_PER_THREAD) {
    return { allowed: false, reason: `스레드당 최대 ${MAX_REPLIES_PER_THREAD}개의 답장만 허용됩니다.` };
  }

  const daysSinceLastReply = calculateDaysSince(thread.lastReplyAt);
  if (daysSinceLastReply > THREAD_AUTO_LOCK_DAYS) {
    return { allowed: false, reason: `${THREAD_AUTO_LOCK_DAYS}일 이상 비활성 상태인 스레드입니다. 자동 잠금됩니다.` };
  }

  // userId는 향후 밴/뮤트 등 확장용
  void userId;

  return { allowed: true, reason: '' };
}

// --- 스레드 잠금/해제 권한 ---

export function canLockThread(thread: ThreadInfo, userId: string): boolean {
  if (thread.status.type === 'locked') {
    return false;
  }
  // 스레드 생성자만 잠금 가능
  return thread.createdBy === userId;
}

export function canUnlockThread(thread: ThreadInfo, userId: string): boolean {
  if (thread.status.type !== 'locked') {
    return false;
  }
  // 스레드 생성자 또는 잠금한 사람이 해제 가능
  return thread.createdBy === userId || thread.status.lockedBy === userId;
}

// --- 자동 잠금 판별 ---

export function shouldAutoLock(thread: ThreadInfo): boolean {
  if (thread.status.type !== 'active') {
    return false;
  }
  return calculateDaysSince(thread.lastReplyAt) > THREAD_AUTO_LOCK_DAYS;
}

export function calculateDaysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / MS_PER_DAY);
}

// --- 스레드 정렬 ---

export function sortThreadsByLastReply(threads: ThreadInfo[]): ThreadInfo[] {
  return [...threads].sort(
    (a, b) => new Date(b.lastReplyAt).getTime() - new Date(a.lastReplyAt).getTime(),
  );
}

export function filterActiveThreads(threads: ThreadInfo[]): ThreadInfo[] {
  return threads.filter((t) => t.status.type === 'active');
}

// --- 미읽음 계산 ---

export function calculateUnreadReplies(
  replies: ThreadReply[],
  lastReadReplyId: string,
): number {
  if (lastReadReplyId === '') {
    return replies.length;
  }

  const lastReadIndex = replies.findIndex((r) => r.id === lastReadReplyId);
  if (lastReadIndex === -1) {
    return replies.length;
  }

  return replies.length - lastReadIndex - 1;
}

export function calculateChannelUnreadCount(
  messages: { id: string; createdAt: string }[],
  readPosition: ReadPosition,
): UnreadCount {
  const lastReadId = readPosition.lastReadMessageId;
  let messageCount = 0;

  if (lastReadId === '') {
    messageCount = messages.length;
  } else {
    const lastReadIndex = messages.findIndex((m) => m.id === lastReadId);
    if (lastReadIndex === -1) {
      messageCount = messages.length;
    } else {
      messageCount = messages.length - lastReadIndex - 1;
    }
  }

  return {
    channelId: readPosition.channelId,
    messageCount,
    threadCount: 0,
    mentionCount: 0,
  };
}

// --- 스레드 요약 생성 ---

export function buildThreadSummary(
  thread: ThreadInfo,
  replies: ThreadReply[],
  lastReadReplyId: string,
): ThreadSummary {
  const lastReply = replies[replies.length - 1];
  const unreadReplyCount = calculateUnreadReplies(replies, lastReadReplyId);

  return {
    threadId: thread.id,
    lastReplyContent: lastReply?.content ?? '',
    lastReplyUserId: lastReply?.userId ?? '',
    lastReplyAt: lastReply?.createdAt ?? thread.createdAt,
    replyCount: thread.replyCount,
    unreadReplyCount,
  };
}

// --- 멘션 추출 ---

export function extractMentions(content: string): string[] {
  const matches = content.matchAll(MENTION_PATTERN);
  const mentions: string[] = [];
  for (const match of matches) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)];
}

// --- 스레드 참여자 추출 ---

export function getThreadParticipants(replies: ThreadReply[], createdBy: string): string[] {
  const participants = new Set<string>([createdBy]);
  for (const reply of replies) {
    participants.add(reply.userId);
  }
  return [...participants];
}

// --- 스레드 상태 전환 유효성 ---

export function canTransitionStatus(
  from: ThreadStatus['type'],
  to: ThreadStatus['type'],
): boolean {
  const allowed: Record<ThreadStatus['type'], ThreadStatus['type'][]> = {
    active: ['locked', 'archived'],
    locked: ['active', 'archived'],
    archived: [],
  };
  return allowed[from].includes(to);
}

// --- 답장 빈도 제한 (rate limiting) ---

export function isRateLimited(
  replies: ThreadReply[],
  userId: string,
  windowMs: number,
  maxReplies: number,
): boolean {
  const now = Date.now();
  const recentReplies = replies.filter(
    (r) => r.userId === userId && now - new Date(r.createdAt).getTime() < windowMs,
  );
  return recentReplies.length >= maxReplies;
}
