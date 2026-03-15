// 레퍼런스: presentational--discriminated-union--semantic-html.md
// C-07: SRP — 개별 알림 항목을 타입별로 분기하여 렌더링
// T-14: discriminated union, T-11: 시맨틱 HTML

import type { Notification } from '../types';

// ✅ T-13: named exported interface
export interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void; // N-03
}

// ✅ P-04: 중첩 삼항 금지 → 헬퍼 함수
function getNotificationIcon(type: Notification['type']): string {
  switch (type) {
    case 'message':
      return '💬';
    case 'mention':
      return '@';
    case 'thread_reply':
      return '↩️';
    case 'channel_invite':
      return '✉️';
  }
}

function getNotificationText(notification: Notification): string {
  switch (notification.type) {
    case 'message':
      return `${notification.senderName}님이 #${notification.channelName}에 메시지를 보냈습니다`;
    case 'mention':
      return `${notification.senderName}님이 #${notification.channelName}에서 회원님을 멘션했습니다`;
    case 'thread_reply':
      return `${notification.senderName}님이 스레드에 답장했습니다`;
    case 'channel_invite':
      return `${notification.inviterName}님이 #${notification.channelName} 채널에 초대했습니다`;
  }
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  // ✅ N-03: handle 접두사
  const handleRead = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
  };

  const icon = getNotificationIcon(notification.type);
  const description = getNotificationText(notification);

  return (
    <li
      className={`px-4 py-3 border-b border-gray-100 ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}
    >
      <button
        type="button"
        onClick={handleRead}
        className="w-full text-left flex items-start gap-3"
        aria-label={`${description}${notification.isRead ? '' : ' — 미읽음'}`}
      >
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-sm" aria-hidden="true">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
            {description}
          </p>
          {/* ✅ P-04: 삼항 조건부 렌더 */}
          {notification.type !== 'channel_invite' ? (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{notification.preview}</p>
          ) : null}
          <time className="text-xs text-gray-400 mt-1 block" dateTime={notification.createdAt}>
            {notification.createdAt}
          </time>
        </div>
        {/* ✅ P-04: 삼항 조건부 렌더 — 미읽음 표시 점 */}
        {notification.isRead ? null : (
          <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" aria-hidden="true" />
        )}
      </button>
    </li>
  );
}
