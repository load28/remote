// 레퍼런스: presentational--discriminated-union--semantic-html.md
// C-07: SRP, C-10: 파일당 1 exported, T-11: 시맨틱 HTML

// ✅ T-13: named exported interface
export interface MessageItemProps {
  content: string;
  authorName: string;
  avatarUrl: string;
  timestamp: string;
  isOwnMessage: boolean; // N-04: is 접두사
}

// ✅ N-01: PascalCase, C-07: 단일 책임 (메시지 1건 표시)
export function MessageItem({
  content,
  authorName,
  avatarUrl,
  timestamp,
  isOwnMessage,
}: MessageItemProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    // ✅ T-11: 시맨틱 HTML
    <article
      className={`flex gap-3 px-4 py-2 hover:bg-gray-50 ${
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
        </div>
        <p className="text-sm text-gray-800 break-words">{content}</p>
      </div>
    </article>
  );
}
