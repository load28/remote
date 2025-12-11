# 3. 슬라이스와 세그먼트 (Slices & Segments)

## 슬라이스 (Slices)

### 정의
슬라이스는 FSD 조직 구조의 **두 번째 수준**입니다. 코드를 **비즈니스 도메인**에 따라 그룹화합니다.

### 핵심 규칙

#### 1. 슬라이스 이름은 표준화되지 않음
비즈니스 도메인에 따라 자유롭게 명명합니다.

```
entities/
├── user/           # 사용자 (소셜 네트워크)
├── post/           # 게시글 (소셜 네트워크)
├── product/        # 상품 (이커머스)
├── photo/          # 사진 (갤러리 앱)
└── task/           # 태스크 (프로젝트 관리)
```

#### 2. 슬라이스 격리 (Slice Isolation)
**같은 계층의 슬라이스끼리는 서로 import할 수 없습니다.**

```typescript
// ❌ 잘못됨: entity에서 다른 entity를 직접 import
// entities/order/model/types.ts
import { User } from '@/entities/user';        // 금지!
import { Product } from '@/entities/product';  // 금지!

// ❌ 잘못됨: feature에서 다른 feature를 import
// features/checkout/ui/CheckoutForm.tsx
import { AddToCart } from '@/features/add-to-cart';  // 금지!
```

#### 3. 슬라이스가 없는 계층
`app`과 `shared` 계층은 슬라이스 없이 **세그먼트로만** 구성됩니다.

```
app/                    # 슬라이스 없음
├── providers/          # 세그먼트
├── styles/             # 세그먼트
└── index.ts

shared/                 # 슬라이스 없음
├── ui/                 # 세그먼트
├── api/                # 세그먼트
├── lib/                # 세그먼트
└── config/             # 세그먼트
```

### 슬라이스 네이밍 컨벤션

#### Entities 계층
**명사** 사용, 비즈니스 도메인 용어 그대로 사용

```
entities/
├── user/               # 사용자
├── product/            # 상품
├── order/              # 주문
├── cart/               # 장바구니
├── payment/            # 결제
├── review/             # 리뷰
├── notification/       # 알림
└── subscription/       # 구독
```

#### Features 계층
**동사-명사** 또는 **액션** 형태 사용

```
features/
├── auth-by-email/              # 이메일 인증
├── auth-by-oauth/              # OAuth 인증
├── add-to-cart/                # 장바구니 추가
├── remove-from-cart/           # 장바구니 제거
├── search-products/            # 상품 검색
├── filter-products/            # 상품 필터
├── write-review/               # 리뷰 작성
├── toggle-theme/               # 테마 전환
└── upload-image/               # 이미지 업로드
```

#### Widgets 계층
**UI 블록의 목적** 또는 **위치** 기반 명명

```
widgets/
├── header/                     # 헤더
├── footer/                     # 푸터
├── sidebar/                    # 사이드바
├── product-list/               # 상품 목록
├── product-details/            # 상품 상세
├── user-profile/               # 사용자 프로필
├── cart-preview/               # 장바구니 미리보기
├── comment-section/            # 댓글 섹션
└── notification-center/        # 알림 센터
```

#### Pages 계층
**라우트/페이지 이름** 기반

```
pages/
├── home/                       # 홈
├── product-detail/             # 상품 상세
├── product-list/               # 상품 목록
├── cart/                       # 장바구니
├── checkout/                   # 결제
├── profile/                    # 프로필
├── settings/                   # 설정
└── not-found/                  # 404
```

---

## 세그먼트 (Segments)

### 정의
세그먼트는 FSD 조직 구조의 **세 번째이자 마지막 수준**입니다. 코드를 **기술적 목적**에 따라 그룹화합니다.

### 표준 세그먼트

| 세그먼트 | 목적 | 포함 내용 |
|---------|------|----------|
| `ui/` | UI 표시 | 컴포넌트, 스타일, 포맷터 |
| `model/` | 데이터/비즈니스 로직 | 타입, 스토어, 스키마, 셀렉터 |
| `api/` | 백엔드 통신 | API 요청 함수, React Query 훅 |
| `lib/` | 라이브러리 코드 | 유틸리티, 헬퍼 함수 |
| `config/` | 설정 | 상수, 피처 플래그, 설정값 |

### 각 세그먼트 상세 가이드

#### ui/ 세그먼트

**포함 내용:**
- React 컴포넌트
- 스타일 파일 (CSS Modules, styled-components 등)
- 날짜/숫자 포맷터
- UI 관련 훅

```
entities/user/ui/
├── UserAvatar.tsx
├── UserAvatar.module.css
├── UserBadge.tsx
├── UserCard.tsx
├── formatters.ts          # 이름 포맷터 등
└── index.ts
```

```typescript
// entities/user/ui/UserCard.tsx
import { User } from '../model/types';
import styles from './UserCard.module.css';

interface UserCardProps {
  user: User;
  actions?: React.ReactNode;  // slots로 외부에서 액션 주입
}

export function UserCard({ user, actions }: UserCardProps) {
  return (
    <div className={styles.card}>
      <UserAvatar user={user} />
      <div className={styles.info}>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
      {actions && (
        <div className={styles.actions}>
          {actions}
        </div>
      )}
    </div>
  );
}
```

#### model/ 세그먼트

**포함 내용:**
- TypeScript 타입/인터페이스 정의
- Zod/Yup 스키마 (유효성 검사)
- 상태 관리 스토어 (Zustand, Redux slice)
- 셀렉터
- 비즈니스 로직

```
entities/user/model/
├── types.ts               # 타입 정의
├── schema.ts              # Zod 스키마
├── store.ts               # Zustand 스토어
├── selectors.ts           # 파생 상태
└── index.ts
```

```typescript
// entities/user/model/types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'moderator' | 'member' | 'guest';

export interface UserProfile extends User {
  bio?: string;
  location?: string;
  website?: string;
}
```

```typescript
// entities/user/model/schema.ts
import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  avatar: z.string().url().optional(),
  role: z.enum(['admin', 'moderator', 'member', 'guest']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;
```

```typescript
// entities/user/model/store.ts
import { create } from 'zustand';
import { User } from './types';

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  setUser: (user) => set({
    currentUser: user,
    isAuthenticated: !!user,
  }),
  logout: () => set({
    currentUser: null,
    isAuthenticated: false,
  }),
}));
```

#### api/ 세그먼트

**포함 내용:**
- API 요청 함수
- React Query/SWR 훅
- API 응답 타입
- 데이터 변환 (mapper)

```
entities/user/api/
├── userApi.ts             # API 요청 함수
├── queries.ts             # React Query 훅
├── keys.ts                # Query keys
├── mappers.ts             # 데이터 변환
└── index.ts
```

```typescript
// entities/user/api/userApi.ts
import { apiClient } from '@/shared/api';
import { User, UserProfile } from '../model/types';

export interface UpdateUserDto {
  name?: string;
  avatar?: string;
  bio?: string;
}

export const userApi = {
  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },

  getProfile: async (id: string): Promise<UserProfile> => {
    const { data } = await apiClient.get(`/users/${id}/profile`);
    return data;
  },

  getCurrent: async (): Promise<User> => {
    const { data } = await apiClient.get('/users/me');
    return data;
  },

  update: async (id: string, dto: UpdateUserDto): Promise<User> => {
    const { data } = await apiClient.patch(`/users/${id}`, dto);
    return data;
  },
};
```

```typescript
// entities/user/api/queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, UpdateUserDto } from './userApi';
import { userKeys } from './keys';

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userApi.getById(id),
    enabled: !!id,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: userApi.getCurrent,
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateUserDto) => userApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
    },
  });
}
```

```typescript
// entities/user/api/keys.ts
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all, 'current'] as const,
};
```

#### lib/ 세그먼트

**포함 내용:**
- 슬라이스 전용 유틸리티 함수
- 헬퍼 함수
- 상수

```
entities/user/lib/
├── formatters.ts          # 포맷 함수
├── validators.ts          # 유효성 검사 함수
├── constants.ts           # 상수
└── index.ts
```

```typescript
// entities/user/lib/formatters.ts
import { User } from '../model/types';

export function formatUserName(user: User): string {
  return user.name || user.email.split('@')[0];
}

export function formatUserInitials(user: User): string {
  const name = formatUserName(user);
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getUserRoleLabel(role: User['role']): string {
  const labels: Record<User['role'], string> = {
    admin: '관리자',
    moderator: '운영자',
    member: '회원',
    guest: '게스트',
  };
  return labels[role];
}
```

#### config/ 세그먼트

**포함 내용:**
- 슬라이스 관련 상수
- 피처 플래그
- 설정값

```typescript
// entities/user/config/constants.ts
export const USER_CONFIG = {
  AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 500,
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member',
  GUEST: 'guest',
} as const;
```

---

## 커스텀 세그먼트

표준 세그먼트 외에도 필요에 따라 **커스텀 세그먼트**를 만들 수 있습니다.

### shared 계층에서의 커스텀 세그먼트

```
shared/
├── ui/                 # 표준
├── api/                # 표준
├── lib/                # 표준
├── config/             # 표준
├── hooks/              # 커스텀: 공용 훅
├── types/              # 커스텀: 공용 타입
├── constants/          # 커스텀: 공용 상수
└── i18n/               # 커스텀: 국제화
```

### app 계층에서의 커스텀 세그먼트

```
app/
├── providers/          # 커스텀: 전역 프로바이더
├── styles/             # 커스텀: 전역 스타일
├── layouts/            # 커스텀: 레이아웃 컴포넌트
└── api-routes/         # 커스텀: Next.js API 라우트 (Route Handlers)
```

---

## 세그먼트 구조 예시 (전체)

```
entities/
└── product/
    ├── ui/
    │   ├── ProductCard/
    │   │   ├── ProductCard.tsx
    │   │   ├── ProductCard.module.css
    │   │   └── index.ts
    │   ├── ProductImage/
    │   │   ├── ProductImage.tsx
    │   │   └── index.ts
    │   ├── ProductPrice/
    │   │   ├── ProductPrice.tsx
    │   │   └── index.ts
    │   └── index.ts
    ├── model/
    │   ├── types.ts
    │   ├── schema.ts
    │   ├── store.ts
    │   ├── selectors.ts
    │   └── index.ts
    ├── api/
    │   ├── productApi.ts
    │   ├── queries.ts
    │   ├── keys.ts
    │   └── index.ts
    ├── lib/
    │   ├── formatters.ts
    │   ├── helpers.ts
    │   └── index.ts
    ├── config/
    │   ├── constants.ts
    │   └── index.ts
    └── index.ts            # Public API
```

---

## 다음 단계

- [Public API 설계 가이드](./04-public-api.md)
- [Next.js App Router 통합](./05-nextjs-integration.md)
