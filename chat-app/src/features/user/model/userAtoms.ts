// S-08: 클라이언트 상태 Jotai atom으로 관리
// S-01: set()으로 새 참조 생성, 직접 변경 금지

import { atom } from 'jotai';

// N-09: ___Atom 접미사
export const currentUserIdAtom = atom<string>('user-1');

// writable atom — write-only 액션
export const switchUserAtom = atom(
  null,
  (_get, set, userId: string) => {
    set(currentUserIdAtom, userId);
  },
);
