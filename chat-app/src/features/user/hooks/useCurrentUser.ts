// 레퍼런스: zustand--state--client-state.md
// S-08: 클라이언트 상태 Zustand로 분리
// S-01: state 직접 변경 금지 → set()으로 새 참조 생성

import { create } from 'zustand';

// ✅ T-13: named exported interface
export interface CurrentUserState {
  currentUserId: string;
}

export interface CurrentUserActions {
  switchUser: (userId: string) => void;
}

// ✅ S-09: Feature 디렉토리 내 배치
export const useCurrentUser = create<CurrentUserState & CurrentUserActions>()((set) => ({
  currentUserId: 'user-1',
  switchUser: (userId) => set({ currentUserId: userId }),
}));
