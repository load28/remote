// 레퍼런스: presentational--discriminated-union--semantic-html.md
// C-07: SRP, C-10: 파일당 1 exported

// ✅ P-03: 모듈 레벨 상수
const MAX_DISPLAY_COUNT = 99;

// ✅ T-13: named exported interface
export interface UnreadBadgeProps {
  count: number;
  hasMention: boolean;
}

// ✅ C-07: 단일 책임 — 미읽음 배지 표시
export function UnreadBadge({ count, hasMention }: UnreadBadgeProps) {
  if (count === 0) {
    return null;
  }

  const displayCount = count > MAX_DISPLAY_COUNT ? `${MAX_DISPLAY_COUNT}+` : String(count);
  const bgColor = hasMention ? 'bg-red-500' : 'bg-indigo-500';

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold text-white rounded-full ${bgColor}`}
      role="status"
      aria-label={`미읽음 ${count}개${hasMention ? ', 멘션 포함' : ''}`}
    >
      {displayCount}
    </span>
  );
}
