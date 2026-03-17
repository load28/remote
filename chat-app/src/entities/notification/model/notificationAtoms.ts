// S-08: 클라이언트 상태 Jotai atom으로 관리
// S-01: set()으로 새 참조 생성, 직접 변경 금지

import { atom } from 'jotai';

// N-09: ___Atom 접미사
// N-04: Boolean is 접두사
export const isNotificationPanelOpenAtom = atom<boolean>(false);

// writable atom — write-only 액션
export const toggleNotificationPanelAtom = atom(
  null,
  (_get, set) => {
    set(isNotificationPanelOpenAtom, (prev) => !prev);
  },
);

export const openNotificationPanelAtom = atom(
  null,
  (_get, set) => {
    set(isNotificationPanelOpenAtom, true);
  },
);

export const closeNotificationPanelAtom = atom(
  null,
  (_get, set) => {
    set(isNotificationPanelOpenAtom, false);
  },
);
