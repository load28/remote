// C-07: SRP, C-10: 파일당 1 exported, T-11: 시맨틱 HTML

// T-13: named exported interface
export interface ThreadReplyItemProps {
  content: string;
  authorName: string;
  avatarUrl: string;
  timestamp: string;
  isOwnReply: boolean;
}

// N-01: PascalCase, C-07: 단일 책임 (스레드 답장 1건 표시)
export function ThreadReplyItem({
  content,
  authorName,
  avatarUrl,
  timestamp,
  isOwnReply,
}: ThreadReplyItemProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    // T-11: 시맨틱 HTML
    <article
      className={`flex gap-2 px-3 py-1.5 hover:bg-gray-50 ${
        isOwnReply ? 'bg-indigo-50/30' : ''
      }`}
    >
      <img
        src={avatarUrl}
        alt={`${authorName} 프로필`}
        className="w-7 h-7 rounded-md flex-shrink-0 mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-xs text-gray-900">{authorName}</span>
          <time className="text-xs text-gray-400" dateTime={timestamp}>
            {formattedTime}
          </time>
        </div>
        <p className="text-sm text-gray-700 break-words">{content}</p>
      </div>
    </article>
  );
}
