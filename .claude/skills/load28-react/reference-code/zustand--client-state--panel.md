---
tags: [zustand, client-state, panel]
rules: [S-01, S-08, S-09, T-13]
description: Zustand 기반 패널 UI 상태 관리 패턴 (열기/닫기, 선택 ID)
---

# Zustand Panel Store 패턴

## 핵심 패턴

- S-08: UI 상태만 Zustand — 서버 상태는 TanStack Query
- S-01: set()으로 불변 업데이트
- T-13: State/Actions 인터페이스 named export
- S-09: 패널 UI 상태는 해당 feature에 코로케이션

```ts
// {layer}/{slice}/model/use{Slice}Store.ts
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

```tsx
// ✅ Consumer: selector로 필요한 상태만 구독

import { useShallow } from 'zustand/react/shallow';

// ✅ GOOD: 단일 필드 selector
function PanelToggleButton() {
  const isPanelOpen = useEntityPanelStore((s) => s.isPanelOpen);
  const openPanel = useEntityPanelStore((s) => s.openPanel);
  // ...
}

// ✅ GOOD: 여러 필드 필요 시 useShallow
function EntityPanel() {
  const { activeEntityId, isPanelOpen, closePanel } = useEntityPanelStore(
    useShallow((s) => ({
      activeEntityId: s.activeEntityId,
      isPanelOpen: s.isPanelOpen,
      closePanel: s.closePanel,
    })),
  );
  // ...
}

// ❌ BAD: 전체 스토어 구독 → closePanel만 필요해도 모든 상태 변경에 리렌더
// const store = useEntityPanelStore(); // 전체 구독 금지
```
