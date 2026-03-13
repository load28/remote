---
tags: [virtual-list, ref, memoization, component, generic, a11y]
rules: [P-02, P-03]
description: 가상화 리스트 — react-virtual 기반 50+ 항목 가상 스크롤
---

```tsx
// shared/components/VirtualList.tsx
// ✅ 제네릭 가상화 리스트 — 50+ 항목에 사용

import { useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// ✅ 모듈 레벨 상수 (P-03)
const DEFAULT_OVERSCAN = 5;

export interface VirtualListProps<T> {
  items: T[];
  height: number;
  estimateSize: number;
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T) => string;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  height,
  estimateSize,
  renderItem,
  getItemKey,
  overscan = DEFAULT_OVERSCAN,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div ref={parentRef} role="list" style={{ overflow: 'auto', height }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => {
          const item = items[virtualRow.index];
          return (
            <div
              key={getItemKey(item)}
              role="listitem"
              style={{
                position: 'absolute',
                top: virtualRow.start,
                height: virtualRow.size,
                width: '100%',
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```
