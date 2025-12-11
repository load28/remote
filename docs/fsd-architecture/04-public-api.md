# 4. Public API 설계 가이드

## Public API란?

FSD에서 **Public API**는 슬라이스나 세그먼트가 외부에 **무엇을 노출할지 선언**하는 것입니다. 일반적으로 `index.ts` 파일을 통해 정의합니다.

### 왜 Public API가 필요한가?

```
┌──────────────────────────────────────────────────────────┐
│                    entities/user/                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  내부 (Private)                                     │ │
│  │  ├── ui/UserAvatar.tsx                             │ │
│  │  ├── ui/UserCard.tsx                               │ │
│  │  ├── model/types.ts                                │ │
│  │  ├── model/store.ts (내부 구현)                     │ │
│  │  └── api/userApi.ts                                │ │
│  └────────────────────────────────────────────────────┘ │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  index.ts (Public API)                              │ │
│  │  ────────────────────────                          │ │
│  │  export { UserAvatar, UserCard } from './ui';      │ │
│  │  export type { User } from './model';              │ │
│  │  export { useUserStore } from './model';           │ │
│  │  export { useUser } from './api';                  │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ 외부에서의 import        │
              │ ────────────────────── │
              │ import {               │
              │   UserCard,            │
              │   useUser              │
              │ } from '@/entities/user';
              └────────────────────────┘
```

### Public API의 장점

1. **캡슐화**: 내부 구현을 숨기고 안정적인 인터페이스만 노출
2. **리팩토링 용이**: 내부 구조 변경 시 외부 영향 최소화
3. **명확한 의존성**: 어떤 것이 사용 가능한지 명확히 알 수 있음
4. **Import 단순화**: 긴 경로 대신 짧은 경로로 import

---

## Public API 작성 규칙

### 1. 명시적 export 사용 (Wildcard 금지)

```typescript
// ❌ 잘못됨: Wildcard re-export
export * from './ui';
export * from './model';
export * from './api';

// ✅ 올바름: 명시적 export
export { UserAvatar, UserCard } from './ui';
export type { User, UserRole } from './model';
export { useUserStore } from './model';
export { useUser, useUsers } from './api';
```

**이유:**
- Tree-shaking 최적화
- 실수로 내부 코드 노출 방지
- import 자동완성 개선

### 2. 타입과 값 분리

```typescript
// entities/user/index.ts

// 값(Value) exports
export { UserAvatar } from './ui/UserAvatar';
export { UserCard } from './ui/UserCard';
export { useUserStore } from './model/store';
export { useUser, useUsers } from './api/queries';

// 타입(Type) exports - type 키워드 사용
export type { User, UserRole, UserProfile } from './model/types';
export type { UpdateUserDto } from './api/userApi';
```

### 3. 계층별 Public API 전략

#### shared 계층 (세그먼트별 index.ts)

shared는 세그먼트별로 별도 index.ts를 가집니다:

```
shared/
├── ui/
│   ├── button/
│   │   ├── Button.tsx
│   │   └── index.ts       # export { Button }
│   ├── input/
│   │   ├── Input.tsx
│   │   └── index.ts       # export { Input }
│   └── index.ts           # 세그먼트 Public API
├── lib/
│   ├── hooks/
│   │   └── index.ts
│   ├── utils/
│   │   └── index.ts
│   └── index.ts           # 세그먼트 Public API
└── api/
    └── index.ts           # 세그먼트 Public API
```

```typescript
// shared/ui/index.ts
export { Button } from './button';
export type { ButtonProps } from './button';

export { Input } from './input';
export type { InputProps } from './input';

export { Modal } from './modal';
export { Card } from './card';
```

```typescript
// 외부에서 import (세그먼트 경로 사용)
import { Button, Input } from '@/shared/ui';
import { useDebounce } from '@/shared/lib';
import { apiClient } from '@/shared/api';
```

#### 슬라이스가 있는 계층 (슬라이스별 index.ts)

entities, features, widgets, pages는 슬라이스별로 하나의 index.ts:

```
entities/
├── user/
│   ├── ui/
│   │   └── index.ts       # 내부용
│   ├── model/
│   │   └── index.ts       # 내부용
│   ├── api/
│   │   └── index.ts       # 내부용
│   └── index.ts           # ⭐ 슬라이스 Public API
└── product/
    └── index.ts           # ⭐ 슬라이스 Public API
```

```typescript
// entities/user/index.ts (슬라이스 Public API)

// UI Components
export { UserAvatar } from './ui/UserAvatar';
export { UserCard } from './ui/UserCard';
export { UserBadge } from './ui/UserBadge';

// Types
export type { User, UserRole, UserProfile } from './model/types';

// Hooks & State
export { useUserStore } from './model/store';
export { useUser, useUsers, useCurrentUser } from './api/queries';

// API (필요한 경우만)
export { userApi } from './api/userApi';

// Utils (필요한 경우만)
export { formatUserName, getUserRoleLabel } from './lib/formatters';
```

---

## Import 규칙

### 1. 외부에서는 반드시 Public API를 통해 import

```typescript
// ✅ 올바름: Public API 사용
import { UserCard, useUser } from '@/entities/user';
import { Button, Input } from '@/shared/ui';

// ❌ 잘못됨: 내부 경로 직접 접근
import { UserCard } from '@/entities/user/ui/UserCard';
import { Button } from '@/shared/ui/button/Button';
```

### 2. 내부에서는 상대 경로 사용

```typescript
// entities/user/ui/UserCard.tsx

// ✅ 올바름: 같은 슬라이스 내에서 상대 경로
import { User } from '../model/types';
import { formatUserName } from '../lib/formatters';
import styles from './UserCard.module.css';

// ❌ 잘못됨: 같은 슬라이스인데 절대 경로
import { User } from '@/entities/user/model/types';
```

### 3. 하위 계층만 import 가능

```typescript
// features/add-to-cart/ui/AddToCartButton.tsx

// ✅ 올바름: 하위 계층(entities, shared) import
import { Product } from '@/entities/product';
import { Button } from '@/shared/ui';

// ❌ 잘못됨: 상위 계층(widgets, pages) import
import { ProductList } from '@/widgets/product-list';
import { CartPage } from '@/pages/cart';

// ❌ 잘못됨: 같은 계층(features)의 다른 슬라이스 import
import { SearchProducts } from '@/features/search-products';
```

---

## Cross-Imports (@x 표기법)

### 문제: Entity 간 관계

실제 비즈니스에서 엔티티들은 서로 연관되어 있습니다:

```typescript
// Order는 User와 Product를 포함
interface Order {
  id: string;
  user: User;           // ← User 엔티티 필요
  items: OrderItem[];   // ← Product 엔티티 필요
  total: number;
}

interface OrderItem {
  product: Product;     // ← Product 엔티티 필요
  quantity: number;
}
```

### 해결책: @x 표기법

엔티티 간 cross-import가 필요한 경우 `@x` 표기법을 사용합니다:

```
entities/
├── user/
│   ├── @x/
│   │   └── order.ts    # order를 위한 특별 export
│   └── index.ts
├── product/
│   ├── @x/
│   │   └── order.ts    # order를 위한 특별 export
│   └── index.ts
└── order/
    ├── model/
    │   └── types.ts    # User, Product 타입 사용
    └── index.ts
```

```typescript
// entities/user/@x/order.ts
// Order 엔티티를 위한 특별 export
export type { User } from '../model/types';
```

```typescript
// entities/product/@x/order.ts
export type { Product } from '../model/types';
```

```typescript
// entities/order/model/types.ts
import type { User } from '@/entities/user/@x/order';
import type { Product } from '@/entities/product/@x/order';

export interface Order {
  id: string;
  user: User;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
}
```

### @x 사용 주의사항

1. **최소한으로 사용**: 정말 필요한 경우에만 사용
2. **Entities 계층에서만**: 다른 계층에서는 cross-import 금지
3. **타입만 export**: 가능하면 `type` 키워드로 타입만 export
4. **명확한 의도**: 어떤 슬라이스를 위한 것인지 파일명으로 표시

### 대안: 제네릭 타입

타입 파라미터를 활용한 느슨한 결합:

```typescript
// entities/order/model/types.ts

// 제네릭으로 느슨한 결합
export interface Order<TUser = unknown, TProduct = unknown> {
  id: string;
  user: TUser;
  items: Array<{
    product: TProduct;
    quantity: number;
  }>;
}

// widgets나 pages에서 구체 타입 주입
import type { User } from '@/entities/user';
import type { Product } from '@/entities/product';
import type { Order } from '@/entities/order';

type ConcreteOrder = Order<User, Product>;
```

---

## ESLint 설정

FSD import 규칙을 강제하기 위한 ESLint 설정:

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['import', 'boundaries'],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
    'boundaries/elements': [
      { type: 'app', pattern: 'src/app/*' },
      { type: 'pages', pattern: 'src/pages/*' },
      { type: 'widgets', pattern: 'src/widgets/*' },
      { type: 'features', pattern: 'src/features/*' },
      { type: 'entities', pattern: 'src/entities/*' },
      { type: 'shared', pattern: 'src/shared/*' },
    ],
  },
  rules: {
    // Public API를 통한 import 강제
    'import/no-internal-modules': [
      'error',
      {
        allow: [
          '**/index',
          '**/index.ts',
          '**/@x/*',
        ],
      },
    ],
    // 계층 의존성 규칙
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          { from: 'app', allow: ['pages', 'widgets', 'features', 'entities', 'shared'] },
          { from: 'pages', allow: ['widgets', 'features', 'entities', 'shared'] },
          { from: 'widgets', allow: ['features', 'entities', 'shared'] },
          { from: 'features', allow: ['entities', 'shared'] },
          { from: 'entities', allow: ['shared'] },
          { from: 'shared', allow: ['shared'] },
        ],
      },
    ],
  },
};
```

---

## TypeScript Path Aliases

`tsconfig.json`에서 경로 별칭 설정:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./src/app/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/widgets/*": ["./src/widgets/*"],
      "@/features/*": ["./src/features/*"],
      "@/entities/*": ["./src/entities/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

---

## 다음 단계

- [Next.js App Router 통합 가이드](./05-nextjs-integration.md)
- [실전 예시](./06-examples.md)
