// S-08: 클라이언트 상태 Zustand로 분리
// S-01: state 직접 변경 금지 → set()으로 새 참조 생성
// S-15: localStorage 스키마 버전 관리

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// P-03: 모듈 레벨 상수
const STORAGE_KEY = 'workspace-selection';
const STORAGE_VERSION = 1;

// T-13: named exported interface
export interface WorkspaceStoreState {
  selectedWorkspaceId: string | null;
}

export interface WorkspaceStoreActions {
  selectWorkspace: (id: string) => void;
}

// S-08: 클라이언트 상태만 Zustand, S-09: Feature 디렉토리 내 배치
export const useWorkspaceStore = create<WorkspaceStoreState & WorkspaceStoreActions>()(
  persist(
    (set) => ({
      selectedWorkspaceId: null,
      selectWorkspace: (id) => set({ selectedWorkspaceId: id }),
    }),
    {
      name: `${STORAGE_KEY}_v${STORAGE_VERSION}`,
      partialize: (state) => ({
        selectedWorkspaceId: state.selectedWorkspaceId,
      }),
    },
  ),
);
