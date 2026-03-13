// 레퍼런스: render-props--children-composition.md
// C-08: 합성(children) 활용 — 레이아웃과 콘텐츠 분리

import type { PropsWithChildren } from 'react';
import { useNotificationState, useNotificationActions } from '@/shared/contexts/NotificationContext';

// ✅ C-10: 파일당 1 exported 컴포넌트
// ✅ C-08: children 합성 — 레이아웃은 고정, 내부 콘텐츠는 교체 가능
export function AuthLayout({ children }: PropsWithChildren) {
  const { notifications } = useNotificationState();
  const { removeNotification } = useNotificationActions();

  return (
    // ✅ T-11: 시맨틱 HTML
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      {/* 알림 영역 */}
      {notifications.length > 0 ? (
        <div className="fixed top-4 right-4 z-50 space-y-2" aria-live="polite">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-4 py-2 rounded-lg shadow-lg text-sm text-white ${
                notification.type === 'success'
                  ? 'bg-green-600'
                  : notification.type === 'error'
                    ? 'bg-red-600'
                    : 'bg-blue-600'
              }`}
              role="alert"
            >
              <span>{notification.message}</span>
              <button
                type="button"
                onClick={() => removeNotification(notification.id)}
                className="ml-3 text-white/80 hover:text-white"
                aria-label="알림 닫기"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* ✅ C-08: children으로 콘텐츠 주입 */}
      <section className="w-full max-w-sm mx-auto p-6">
        {children}
      </section>
    </main>
  );
}
