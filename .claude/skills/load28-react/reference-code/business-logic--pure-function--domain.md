---
tags: [business-logic, pure-function, layer-separation]
rules: [A-05, P-03, N-06, T-04]
description: React 미사용 순수 함수 비즈니스 로직 레이어 패턴
---

# 순수 비즈니스 로직 레이어

## 핵심 패턴

- A-05: React import 없이 테스트 가능
- P-03: 모듈 레벨 상수
- N-06: UPPER_SNAKE_CASE 상수
- T-04: any 금지

```ts
// {Feature}/domain/entityRules.ts
import type { Entity, EntityItem } from '../types';

// P-03, N-06: 모듈 레벨 상수
const MAX_ITEMS_PER_ENTITY = 50;

// --- 권한 판별 (순수 함수) ---

export function canDeleteEntity(entity: Entity, userId: string): boolean {
  return entity.createdBy === userId;
}

// --- 파생 계산 (순수 함수) ---

export function calculateProgress(
  items: EntityItem[],
): { completed: number; total: number; percentage: number } {
  const total = items.length;
  const completed = items.filter((item) => item.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}

// --- 유효성 검증 ---

export function canAddItem(items: EntityItem[]): boolean {
  return items.length < MAX_ITEMS_PER_ENTITY;
}

// --- 정렬/필터 ---

export function sortByCreatedAt<T extends { createdAt: string }>(
  entities: T[],
): T[] {
  return [...entities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
```
