---
tags: [zustand, state, client-state]
rules: [S-08, S-09, S-01, T-13, N-04]
description: Zustand 전역 클라이언트 상태 — 서버/클라이언트 분리, 상태 코로케이션
---

```tsx
// {layer}/{slice}/model/use{Slice}Store.ts — Zustand 전역 클라이언트 상태

import { create } from 'zustand';

// ✅ named exported interface (T-13)
export interface EntityStoreState {
  selectedEntityId: string | null;
  isSidebarOpen: boolean; // N-04: Boolean is 접두사
}

// ✅ actions를 분리하여 명확한 인터페이스
export interface EntityStoreActions {
  selectEntity: (id: string) => void;
  clearSelection: () => void;
  toggleSidebar: () => void;
}

// ✅ S-08: 클라이언트 상태만 Zustand로 관리 (서버 상태는 TanStack Query)
// ✅ S-01: state 직접 변경 금지 → set()으로 새 참조 생성
// ✅ S-09: 상태 코로케이션 — Feature 디렉토리 내 배치
export const useEntityStore = create<EntityStoreState & EntityStoreActions>()((set) => ({
  selectedEntityId: null,
  isSidebarOpen: true,

  selectEntity: (id) => set({ selectedEntityId: id }),
  clearSelection: () => set({ selectedEntityId: null }),
  toggleSidebar: () => set((prev) => ({ isSidebarOpen: !prev.isSidebarOpen })),
}));

```

```tsx
// ✅ selector 패턴: 필요한 상태만 구독 → 불필요한 리렌더 방지
// 컴포넌트에서 useEntityStore() 전체 구독 금지

// ✅ GOOD: 단일 필드 selector
function EntityDetail() {
  const selectedId = useEntityStore((s) => s.selectedEntityId);
  const selectEntity = useEntityStore((s) => s.selectEntity);
  // ...
}

// ✅ GOOD: 여러 필드 필요 시 useShallow로 참조 안정화
import { useShallow } from 'zustand/react/shallow';

function EntitySidebar() {
  const { isSidebarOpen, toggleSidebar } = useEntityStore(
    useShallow((s) => ({ isSidebarOpen: s.isSidebarOpen, toggleSidebar: s.toggleSidebar })),
  );
  // ...
}

// ❌ BAD: 전체 스토어 구독 → name만 변해도 리렌더
// const store = useEntityStore(); // 전체 구독 금지
```
