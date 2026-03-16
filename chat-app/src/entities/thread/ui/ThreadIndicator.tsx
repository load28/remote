// C-07: SRP, C-10: 파일당 1 exported, T-11: 시맨틱 HTML

// T-13: named exported interface
export interface ThreadIndicatorProps {
  replyCount: number;
  lastReplyAt: string;
  unreadCount: number;
  onOpenThread: () => void;
}

// C-07: 단일 책임 — 메시지 하단 스레드 인디케이터 표시
export function ThreadIndicator({
  replyCount,
  lastReplyAt,
  unreadCount,
  onOpenThread,
}: ThreadIndicatorProps) {
  const formattedTime = new Date(lastReplyAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const hasUnread = unreadCount > 0;

  return (
    // T-11: button 시맨틱 HTML
    <button
      type="button"
      onClick={onOpenThread}
      className="flex items-center gap-2 mt-1 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
      aria-label={`스레드 열기: 답장 ${replyCount}개${hasUnread ? `, 미읽음 ${unreadCount}개` : ''}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2z" clipRule="evenodd" />
      </svg>
      <span className="font-medium">{replyCount}개의 답장</span>
      {hasUnread ? (
        <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
          {unreadCount}
        </span>
      ) : null}
      <span className="text-gray-400">마지막 답장 {formattedTime}</span>
    </button>
  );
}
