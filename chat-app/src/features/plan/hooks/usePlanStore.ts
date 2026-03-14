// S-08: 클라이언트 상태만 Zustand로 관리
// S-01: state 직접 변경 금지 → set()으로 새 참조 생성
// S-09: 상태 코로케이션

import { create } from 'zustand';

// ✅ T-13: named exported interface
export interface PlanStoreState {
  activePlanId: string | null;
  isPlanPanelOpen: boolean;
}

export interface PlanStoreActions {
  openPlan: (planId: string) => void;
  closePlan: () => void;
  togglePlanPanel: () => void;
}

// ✅ S-08: UI 상태만 Zustand (서버 상태는 TanStack Query)
export const usePlanStore = create<PlanStoreState & PlanStoreActions>()((set) => ({
  activePlanId: null,
  isPlanPanelOpen: false,

  // ✅ S-01: set()으로 불변 업데이트
  openPlan: (planId) => set({ activePlanId: planId, isPlanPanelOpen: true }),
  closePlan: () => set({ activePlanId: null, isPlanPanelOpen: false }),
  // ✅ S-06: 함수형 setState
  togglePlanPanel: () => set((prev) => ({ isPlanPanelOpen: !prev.isPlanPanelOpen })),
}));
