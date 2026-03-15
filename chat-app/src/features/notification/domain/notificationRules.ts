// 레퍼런스: business-logic--pure-function--domain.md
// A-05: React import 없이 테스트 가능한 순수 함수
// T-04: any 금지

import type { Notification } from '../types';

// --- 파생 계산 (순수 함수) ---

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((notification) => !notification.isRead).length;
}
