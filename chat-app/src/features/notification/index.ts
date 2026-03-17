// A-07: barrel file — FSD: entities에서 re-export + feature 전용 export
// P-06: named export만

// entities/notification에서 re-export (도메인 모델)
export { useNotifications, useReadNotification, useReadAllNotifications, isNotificationPanelOpenAtom, toggleNotificationPanelAtom, openNotificationPanelAtom, closeNotificationPanelAtom, getUnreadCount } from '@/entities/notification';
export type { Notification, NotificationType } from '@/entities/notification';

// feature 전용 (사용자 인터랙션 UI)
export { NotificationBell } from './components/NotificationBell';
export type { NotificationBellProps } from './components/NotificationBell';
export { NotificationItem } from './components/NotificationItem';
export type { NotificationItemProps } from './components/NotificationItem';
export { NotificationPanel } from './components/NotificationPanel';
export type { NotificationPanelProps } from './components/NotificationPanel';
