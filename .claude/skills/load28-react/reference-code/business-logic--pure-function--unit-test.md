---
tags: [business-logic, pure-function, unit-test, layer-separation]
rules: [A-05]
description: 비즈니스 로직 분리 — React 미사용 순수 함수 + 단위 테스트
---

```tsx
// {Feature}/domain/{feature}Rules.ts
// ✅ React import 없음 → 순수 함수 → 단위 테스트 용이

export interface Entity {
  id: string;
  status: 'draft' | 'active' | 'archived';
  priority: number;
  createdAt: string;
}

// 순수 함수: 필터, 정렬, 유효성 검증, 계산
export function filterByStatus(entities: Entity[], status: Entity['status']): Entity[] {
  return entities.filter(e => e.status === status);
}

export function sortByPriority(entities: Entity[]): Entity[] {
  return [...entities].sort((a, b) => b.priority - a.priority);
}

export function calculateActiveRate(entities: Entity[]): number {
  if (entities.length === 0) return 0;
  return filterByStatus(entities, 'active').length / entities.length;
}

export function canTransition(from: Entity['status'], to: Entity['status']): boolean {
  const allowed: Record<Entity['status'], Entity['status'][]> = {
    draft: ['active'],
    active: ['archived'],
    archived: ['draft'],
  };
  return allowed[from].includes(to);
}
```

```tsx
// {Feature}/domain/{feature}Rules.test.ts

import { filterByStatus, canTransition, calculateActiveRate } from './{feature}Rules';

const entities: Entity[] = [
  { id: '1', status: 'active', priority: 3, createdAt: '2024-01-01' },
  { id: '2', status: 'draft', priority: 1, createdAt: '2024-01-02' },
  { id: '3', status: 'active', priority: 2, createdAt: '2024-01-03' },
];

test('filterByStatus returns matching entities', () => {
  expect(filterByStatus(entities, 'active')).toHaveLength(2);
});

test('calculateActiveRate computes ratio', () => {
  expect(calculateActiveRate(entities)).toBeCloseTo(0.667, 2);
});

test('calculateActiveRate returns 0 for empty', () => {
  expect(calculateActiveRate([])).toBe(0);
});

test('canTransition validates allowed transitions', () => {
  expect(canTransition('draft', 'active')).toBe(true);
  expect(canTransition('draft', 'archived')).toBe(false);
});
```
