---
tags: [zustand, client-state, interactive]
rules: [S-01, S-08, S-09, T-13, N-05]
description: Zustand 기반 패널 UI 상태 관리 패턴 (열기/닫기, 선택 ID)
---

# Zustand Panel Store 패턴

## 핵심 패턴

- S-08: UI 상태만 Zustand — 서버 상태는 TanStack Query
- S-01: set()으로 불변 업데이트
- T-13: State/Actions 인터페이스 named export
- S-09: 패널 UI 상태는 해당 feature에 코로케이션

```ts
// {Feature}/hooks/use{Feature}Store.ts
import { create } from 'zustand';

export interface EntityPanelState {
  activeEntityId: string | null;
  isPanelOpen: boolean;
}

export interface EntityPanelActions {
  openPanel: (entityId: string) => void;
  closePanel: () => void;
}

export const useEntityPanelStore = create<EntityPanelState & EntityPanelActions>()(
  (set) => ({
    activeEntityId: null,
    isPanelOpen: false,

    openPanel: (entityId) =>
      set({ activeEntityId: entityId, isPanelOpen: true }),
    closePanel: () =>
      set({ activeEntityId: null, isPanelOpen: false }),
  }),
);
```
