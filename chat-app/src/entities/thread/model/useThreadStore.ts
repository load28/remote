// S-08: 클라이언트 상태만 Zustand로 관리
// S-01: state 직접 변경 금지 → set()으로 새 참조 생성
// S-09: 상태 코로케이션

import { create } from 'zustand';

// T-13: named exported interface
export interface ThreadStoreState {
  activeThreadId: string | null;
  isThreadPanelOpen: boolean;
}

export interface ThreadStoreActions {
  openThread: (threadId: string) => void;
  closeThread: () => void;
}

// S-08: UI 상태만 Zustand (서버 상태는 TanStack Query)
export const useThreadStore = create<ThreadStoreState & ThreadStoreActions>()((set) => ({
  activeThreadId: null,
  isThreadPanelOpen: false,

  // S-01: set()으로 불변 업데이트
  openThread: (threadId) => set({ activeThreadId: threadId, isThreadPanelOpen: true }),
  closeThread: () => set({ activeThreadId: null, isThreadPanelOpen: false }),
}));
