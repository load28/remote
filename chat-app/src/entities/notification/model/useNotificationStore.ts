// S-08: 클라이언트 상태 Zustand로 분리
// S-01: state 직접 변경 금지 → set()으로 새 참조 생성

import { create } from 'zustand';

// T-13: named exported interface
export interface NotificationPanelState {
  isPanelOpen: boolean; // N-04: Boolean is 접두사
}

export interface NotificationPanelActions {
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

// S-09: Feature 디렉토리 내 배치
export const useNotificationStore = create<NotificationPanelState & NotificationPanelActions>()(
  (set) => ({
    isPanelOpen: false,

    togglePanel: () => set((prev) => ({ isPanelOpen: !prev.isPanelOpen })),
    openPanel: () => set({ isPanelOpen: true }),
    closePanel: () => set({ isPanelOpen: false }),
  }),
);
