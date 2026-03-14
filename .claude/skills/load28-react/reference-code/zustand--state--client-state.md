---
tags: [zustand, state, client-state]
rules: [S-08, S-09, S-01]
description: Zustand 전역 클라이언트 상태 — 서버/클라이언트 분리, 상태 코로케이션
---

```tsx
// {Feature}/hooks/use{Feature}Store.ts — Zustand 전역 클라이언트 상태

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

// ✅ selector 패턴: 필요한 상태만 구독 → 불필요한 리렌더 방지
// const selectedId = useEntityStore((s) => s.selectedEntityId);
// const selectEntity = useEntityStore((s) => s.selectEntity);
```
