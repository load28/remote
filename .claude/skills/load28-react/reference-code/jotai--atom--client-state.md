---
tags: [jotai, atom, client-state]
rules: [S-08, S-09, S-01, S-06, T-13, N-09, N-04]
description: Jotai 기본 atom 패턴 — primitive atom, useAtomValue/useSetAtom 최소 권한
---

```ts
// {layer}/{slice}/model/{feature}Atoms.ts — Jotai primitive atom 정의

import { atom } from 'jotai';

// ✅ N-09: ___Atom 접미사로 atom임을 명시
// ✅ T-13: named export
// ✅ N-04: boolean은 is/has/can/should 접두사
export const selectedEntityIdAtom = atom<string | null>(null);
export const isSidebarOpenAtom = atom<boolean>(true);
export const filterKeywordAtom = atom<string>('');
```

```ts
// {layer}/{slice}/model/{feature}Atoms.ts — writable atom으로 액션 표현

import { atom } from 'jotai';

// ✅ primitive atom (상태 저장)
export const selectedEntityIdAtom = atom<string | null>(null);

// ✅ writable atom으로 액션 캡슐화 (write-only)
// S-01: set()으로 새 참조 생성, 직접 변경 금지
export const selectEntityAtom = atom(
  null, // read 불필요 → null
  (_get, set, id: string) => {
    set(selectedEntityIdAtom, id);
  },
);

export const clearSelectionAtom = atom(
  null,
  (_get, set) => {
    set(selectedEntityIdAtom, null);
  },
);

// ✅ writable atom으로 토글 액션 (functional update)
// S-06: 이전값 기반이면 함수형 업데이트
export const toggleSidebarAtom = atom(
  null,
  (_get, set) => {
    set(isSidebarOpenAtom, (prev) => !prev);
  },
);
```

```tsx
// ✅ Consumer 패턴: 최소 권한 원칙으로 구독 범위 제한
// S-08: 클라이언트 상태만 Jotai — 서버 상태는 TanStack Query

import { useAtomValue, useSetAtom, useAtom } from 'jotai';
import { selectedEntityIdAtom, isSidebarOpenAtom, selectEntityAtom } from '../model/entityAtoms';

// ✅ GOOD: useAtomValue — 읽기만 필요할 때 (쓰기 구독 없음)
function EntityDetail() {
  const selectedId = useAtomValue(selectedEntityIdAtom);
  // ...
}

// ✅ GOOD: useSetAtom — 쓰기만 필요할 때 (값 변경에 리렌더 안 됨)
function EntityActions() {
  const selectEntity = useSetAtom(selectEntityAtom);
  const handleSelect = (id: string) => selectEntity(id);
  // ...
}

// ✅ GOOD: useAtom — 읽기+쓰기 모두 필요할 때만 사용
function EntitySidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(isSidebarOpenAtom);
  // ...
}

// ❌ BAD: 쓰기만 필요한데 useAtom 사용 → 불필요한 리렌더
// const [, selectEntity] = useAtom(selectEntityAtom);
// → useSetAtom(selectEntityAtom) 사용
```
