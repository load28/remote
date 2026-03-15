// 레퍼런스: interactive--event-naming--a11y.md (유사 레퍼런스 참고)
// C-07: SRP — 벨 아이콘 + 미읽음 뱃지 렌더링
// T-11: 시맨틱 HTML (button), N-03: on/handle

// ✅ T-13: named exported interface
export interface NotificationBellProps {
  unreadCount: number;
  onTogglePanel: () => void; // N-03
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function NotificationBell({ unreadCount, onTogglePanel }: NotificationBellProps) {
  return (
    <button
      type="button"
      onClick={onTogglePanel}
      className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
      aria-label={`알림 ${unreadCount > 0 ? `${unreadCount}개 미읽음` : ''}`}
    >
      {/* ✅ T-11: 시맨틱 button + aria-label */}
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-2.83-2h5.66A3 3 0 0110 18z" />
      </svg>
      {/* ✅ P-04: 삼항 조건부 렌더 */}
      {unreadCount > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-red-500 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </button>
  );
}
