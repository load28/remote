// 레퍼런스: interactive--event-naming--a11y.md, cleanup--useEffect--event-listener--abort--web-socket.md
// C-07: SRP, A-08: 단방향 데이터 흐름, S-13: controlled

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ThreadReplyItem } from './ThreadReplyItem';
import type { ThreadReply, ThreadInfo, ThreadStatus } from '../types';

// ✅ A-01: feature→feature 의존 금지 → 필요한 형태만 정의
export interface ThreadAuthor {
  displayName: string;
  avatarUrl: string;
}

// ✅ T-13: named exported interface
export interface ThreadPanelProps {
  thread: ThreadInfo;
  replies: ThreadReply[];
  authorMap: Record<string, ThreadAuthor>;
  currentUserId: string;
  parentMessageContent: string;
  parentMessageAuthorName: string;
  isReplying: boolean;
  canReply: boolean;
  replyBlockedReason: string;
  canLock: boolean;
  canUnlock: boolean;
  onReply: (content: string) => void;
  onLock: (reason: string) => void;
  onUnlock: () => void;
  onClose: () => void;
}

// ✅ P-03: 모듈 레벨 상수
const STATUS_LABEL: Record<ThreadStatus['type'], string> = {
  active: '활성',
  locked: '잠김',
  archived: '보관됨',
};

// ✅ C-10: 파일당 1 exported 컴포넌트
export function ThreadPanel({
  thread,
  replies,
  authorMap,
  currentUserId,
  parentMessageContent,
  parentMessageAuthorName,
  isReplying,
  canReply,
  replyBlockedReason,
  canLock,
  canUnlock,
  onReply,
  onLock,
  onUnlock,
  onClose,
}: ThreadPanelProps) {
  // ✅ S-09: 사용처 가까이
  const [replyContent, setReplyContent] = useState('');
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // ✅ S-16: useEffect cleanup 불필요 (scrollIntoView는 구독 아님)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  // ✅ N-03: 내부 핸들러 handle 접두사
  const handleSubmitReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = replyContent.trim();
    if (trimmed.length === 0) return;
    onReply(trimmed);
    setReplyContent('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const trimmed = replyContent.trim();
      if (trimmed.length === 0) return;
      onReply(trimmed);
      setReplyContent('');
    }
  };

  const handleLock = () => {
    const trimmedReason = lockReason.trim();
    if (trimmedReason.length === 0) return;
    onLock(trimmedReason);
    setIsLockDialogOpen(false);
    setLockReason('');
  };

  const hasReplyContent = replyContent.trim().length > 0;
  const statusLabel = STATUS_LABEL[thread.status.type];

  return (
    // ✅ T-11: 시맨틱 HTML
    <aside className="w-96 border-l border-gray-200 flex flex-col bg-white" aria-label="스레드 패널">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">스레드</h2>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            thread.status.type === 'active' ? 'bg-green-100 text-green-700' :
            thread.status.type === 'locked' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {statusLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="스레드 닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </header>

      {/* 원본 메시지 */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 mb-1">{parentMessageAuthorName}</p>
        <p className="text-sm text-gray-800">{parentMessageContent}</p>
      </div>

      {/* 답장 목록 */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          <p className="px-3 py-1 text-xs text-gray-400">
            {thread.replyCount}개의 답장
          </p>
          {replies.map((reply) => {
            const author = authorMap[reply.userId];
            return (
              <ThreadReplyItem
                key={reply.id}
                content={reply.content}
                authorName={author?.displayName ?? '알 수 없음'}
                avatarUrl={author?.avatarUrl ?? ''}
                timestamp={reply.createdAt}
                isOwnReply={reply.userId === currentUserId}
              />
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 잠금/해제 액션 */}
      {canLock || canUnlock ? (
        <div className="px-4 py-2 border-t border-gray-100">
          {canLock ? (
            isLockDialogOpen ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="잠금 사유 입력..."
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  aria-label="잠금 사유"
                />
                <button
                  type="button"
                  onClick={handleLock}
                  disabled={lockReason.trim().length === 0}
                  className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  잠금
                </button>
                <button
                  type="button"
                  onClick={() => setIsLockDialogOpen(false)}
                  className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLockDialogOpen(true)}
                className="text-xs text-red-500 hover:text-red-600"
              >
                스레드 잠금
              </button>
            )
          ) : null}
          {canUnlock ? (
            <button
              type="button"
              onClick={onUnlock}
              className="text-xs text-green-600 hover:text-green-700"
            >
              스레드 잠금 해제
            </button>
          ) : null}
        </div>
      ) : null}

      {/* 답장 입력 */}
      {canReply ? (
        <form onSubmit={handleSubmitReply} className="border-t border-gray-200 p-3">
          <div className="flex gap-2 items-end">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="답장을 입력하세요..."
              rows={1}
              className="flex-1 resize-none rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="스레드 답장 입력"
              disabled={isReplying}
            />
            <button
              type="submit"
              disabled={!hasReplyContent || isReplying}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isReplying ? '전송 중...' : '답장'}
            </button>
          </div>
        </form>
      ) : (
        <div className="border-t border-gray-200 p-3">
          <p className="text-xs text-gray-400 text-center">{replyBlockedReason}</p>
        </div>
      )}
    </aside>
  );
}
