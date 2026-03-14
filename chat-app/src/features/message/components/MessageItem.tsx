// 레퍼런스: presentational--discriminated-union--semantic-html.md, interactive--event-naming--a11y.md
// C-07: SRP, C-10: 파일당 1 exported, T-11: 시맨틱 HTML

import type { ReactNode } from 'react';

// ✅ C-04: props 7개 이하 — thread 관련 props 그룹화
export interface MessageThreadInfo {
  hasThread: boolean;
  onStartThread: () => void;
  indicator: ReactNode;
}

// ✅ T-13: named exported interface — 6개 props
export interface MessageItemProps {
  content: string;
  authorName: string;
  avatarUrl: string;
  timestamp: string;
  isOwnMessage: boolean;
  thread: MessageThreadInfo;
}

// ✅ N-01: PascalCase, C-07: 단일 책임 (메시지 1건 표시)
export function MessageItem({
  content,
  authorName,
  avatarUrl,
  timestamp,
  isOwnMessage,
  thread,
}: MessageItemProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    // ✅ T-11: 시맨틱 HTML
    <article
      className={`group flex gap-3 px-4 py-2 hover:bg-gray-50 ${
        isOwnMessage ? 'bg-indigo-50/30' : ''
      }`}
    >
      <img
        src={avatarUrl}
        alt={`${authorName} 프로필`}
        className="w-9 h-9 rounded-lg flex-shrink-0 mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm text-gray-900">{authorName}</span>
          <time className="text-xs text-gray-500" dateTime={timestamp}>
            {formattedTime}
          </time>
          {/* 스레드 시작 버튼 — hover 시에만 표시 */}
          {thread.hasThread ? null : (
            <button
              type="button"
              onClick={thread.onStartThread}
              className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-indigo-600 transition-opacity"
              aria-label="스레드 시작"
            >
              답장
            </button>
          )}
        </div>
        <p className="text-sm text-gray-800 break-words">{content}</p>
        {/* 스레드 인디케이터 — 합성 패턴 (C-08) */}
        {thread.indicator}
      </div>
    </article>
  );
}
