// S-08: 클라이언트 상태 Jotai atom으로 관리
// S-01: set()으로 새 참조 생성, 직접 변경 금지

import { atom } from 'jotai';

// N-09: ___Atom 접미사
// N-04: Boolean is 접두사
export const activePlanIdAtom = atom<string | null>(null);
export const isPlanPanelOpenAtom = atom<boolean>(false);

// writable atom — write-only 액션
export const openPlanAtom = atom(
  null,
  (_get, set, planId: string) => {
    set(activePlanIdAtom, planId);
    set(isPlanPanelOpenAtom, true);
  },
);

export const closePlanAtom = atom(
  null,
  (_get, set) => {
    set(activePlanIdAtom, null);
    set(isPlanPanelOpenAtom, false);
  },
);

// S-06: 함수형 업데이트
export const togglePlanPanelAtom = atom(
  null,
  (_get, set) => {
    set(isPlanPanelOpenAtom, (prev) => !prev);
  },
);
