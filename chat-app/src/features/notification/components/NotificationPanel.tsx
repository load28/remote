// 레퍼런스: interactive--event-naming--a11y.md (유사 레퍼런스 참고)
// C-07: SRP — 알림 사이드 패널에서 알림 리스트와 전체 읽음 기능 제공
// A-08: 단방향 데이터 흐름 (props down, events up)

import { NotificationItem } from './NotificationItem';
import type { Notification } from '../types';

// ✅ T-13: named exported interface
export interface NotificationPanelProps {
  notifications: Notification[];
  onReadNotification: (id: string) => void; // N-03
  onReadAll: () => void; // N-03
  onClose: () => void; // N-03
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function NotificationPanel({
  notifications,
  onReadNotification,
  onReadAll,
  onClose,
}: NotificationPanelProps) {
  const hasNotifications = notifications.length > 0;

  return (
    <aside className="w-96 border-l border-gray-200 flex flex-col bg-white" aria-label="알림 패널">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-sm">알림</h2>
        <div className="flex items-center gap-2">
          {hasNotifications ? (
            <button
              type="button"
              onClick={onReadAll}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              aria-label="모든 알림을 읽음 처리"
            >
              전체 읽음
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="알림 패널 닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* ✅ P-04: 삼항 조건부 렌더 */}
        {hasNotifications ? (
          <ul>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={onReadNotification}
              />
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-full py-12">
            <p className="text-sm text-gray-400">새로운 알림이 없습니다</p>
          </div>
        )}
      </div>
    </aside>
  );
}
