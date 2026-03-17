// S-08: 클라이언트 상태 Jotai atom으로 관리
// S-01: set()으로 새 참조 생성, 직접 변경 금지

import { atom } from 'jotai';

// N-09: ___Atom 접미사
// N-04: Boolean is 접두사
export const activeThreadIdAtom = atom<string | null>(null);
export const isThreadPanelOpenAtom = atom<boolean>(false);

// writable atom — write-only 액션
export const openThreadAtom = atom(
  null,
  (_get, set, threadId: string) => {
    set(activeThreadIdAtom, threadId);
    set(isThreadPanelOpenAtom, true);
  },
);

export const closeThreadAtom = atom(
  null,
  (_get, set) => {
    set(activeThreadIdAtom, null);
    set(isThreadPanelOpenAtom, false);
  },
);
