// 레퍼런스: authentication/context--provider--useMemo--useCallback.md
// S-07: 읽기/쓰기 Context 분리 → 읽기만 하는 컴포넌트는 actions 변경에 리렌더 안 됨
// S-14: Context Provider value useMemo 적용

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import { createSafeContext } from '@/shared/lib/createSafeContext';

// ✅ T-14: discriminated union
export type NotificationType = 'success' | 'error' | 'info';

// ✅ T-13: named exported interface
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationState {
  notifications: Notification[];
}

interface NotificationActions {
  addNotification: (type: NotificationType, message: string) => void;
  removeNotification: (id: string) => void;
}

// ✅ S-07: 읽기/쓰기 Context 분리
const [NotificationStateProvider, useNotificationState] =
  createSafeContext<NotificationState>('NotificationState');
const [NotificationActionsProvider, useNotificationActions] =
  createSafeContext<NotificationActions>('NotificationActions');

export { useNotificationState, useNotificationActions };

// ✅ P-03: 모듈 레벨 상수
const INITIAL_NOTIFICATIONS: Notification[] = [];
const AUTO_DISMISS_MS = 3000;

let notificationIdCounter = 0;

export function NotificationProvider({ children }: PropsWithChildren) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  // ✅ S-11: 렌더에 안 쓰이는 값 ref — 타이머 ID 관리 (S-16 cleanup 대상)
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // ✅ S-16: 언마운트 시 모든 타이머 정리
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timerId of timers.values()) {
        clearTimeout(timerId);
      }
      timers.clear();
    };
  }, []);

  // ✅ useCallback으로 안정 참조
  const addNotification = useCallback((type: NotificationType, message: string) => {
    const id = `notification-${++notificationIdCounter}`;
    // ✅ S-06: 함수형 setState
    setNotifications((prev) => [...prev, { id, type, message }]);

    // 자동 제거 타이머 + cleanup 관리
    const timerId = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      timersRef.current.delete(id);
    }, AUTO_DISMISS_MS);
    timersRef.current.set(id, timerId);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // ✅ S-16: 수동 제거 시 타이머도 정리
    const timerId = timersRef.current.get(id);
    if (timerId) {
      clearTimeout(timerId);
      timersRef.current.delete(id);
    }
  }, []);

  // ✅ S-14: Provider value useMemo
  const stateValue = useMemo(() => ({ notifications }), [notifications]);
  const actionsValue = useMemo(
    () => ({ addNotification, removeNotification }),
    [addNotification, removeNotification],
  );

  return (
    <NotificationStateProvider value={stateValue}>
      <NotificationActionsProvider value={actionsValue}>
        {children}
      </NotificationActionsProvider>
    </NotificationStateProvider>
  );
}
