// S-08: 클라이언트 상태 Jotai atom으로 관리
// S-01: set()으로 새 참조 생성, 직접 변경 금지
// S-15: localStorage 스키마 버전 관리

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// P-03: 모듈 레벨 상수
const STORAGE_KEY = 'workspace-selection';
const STORAGE_VERSION = 2;

// N-09: ___Atom 접미사
export const selectedWorkspaceIdAtom = atomWithStorage<string | null>(
  `${STORAGE_KEY}_v${STORAGE_VERSION}`,
  null,
);

// writable atom — write-only 액션
export const selectWorkspaceAtom = atom(
  null,
  (_get, set, id: string) => {
    set(selectedWorkspaceIdAtom, id);
  },
);
