---
tags: [feature-module, module-structure, barrel-file, layer-separation]
rules: [A-02, A-07, P-06, T-03, T-13]
description: Feature 모듈 완전체 — 디렉토리 구조 + barrel file public API
---

```
src/features/{feature-name}/
├── components/
│   ├── {Component}.tsx
│   └── {Component}.test.tsx           ← 소스 옆 테스트 (T-03)
├── hooks/
│   ├── use{Feature}.ts
│   └── use{Feature}.test.ts
├── api/
│   └── {feature}Api.ts               ← httpClient 래퍼만 import (A-09)
├── domain/
│   ├── {feature}Rules.ts             ← 순수 비즈니스 로직 (A-05)
│   └── {feature}Rules.test.ts
├── types.ts                           ← named exported interfaces (T-13)
└── index.ts                           ← public API barrel (A-07)
```

```tsx
// index.ts — barrel file: named export만 (P-06)
export { EntityList } from './components/EntityList';
export { EntityDetail } from './components/EntityDetail';
export { useEntities, useEntityById } from './hooks/useEntities';
export type { Entity, EntityStatus } from './types';
// 내부 domain/, api/ 는 export하지 않음 → 모듈 경계 (A-07)
```
