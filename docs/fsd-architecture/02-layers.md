# 2. 계층 (Layers) 상세 가이드

## 계층별 분류 기준

FSD의 계층은 **코드의 영향 범위**에 따라 분류됩니다. 아래에서 위로 갈수록 더 구체적이고, 위에서 아래로 갈수록 더 일반적입니다.

```
┌─────────────────────────────────────────────────────────────┐
│  app       │ 앱 전체에 영향        │ 1개만 존재               │
├─────────────────────────────────────────────────────────────┤
│  pages     │ 특정 페이지에 영향     │ 라우트 수만큼 존재        │
├─────────────────────────────────────────────────────────────┤
│  widgets   │ 여러 페이지에서 재사용  │ 필요한 만큼 존재          │
├─────────────────────────────────────────────────────────────┤
│  features  │ 사용자 기능 단위       │ 기능 수만큼 존재          │
├─────────────────────────────────────────────────────────────┤
│  entities  │ 비즈니스 도메인 단위    │ 도메인 객체 수만큼 존재    │
├─────────────────────────────────────────────────────────────┤
│  shared    │ 앱 전체에서 재사용     │ 세그먼트로만 구성          │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. shared 계층

### 정의
프로젝트 전반에서 재사용되는 **비즈니스 로직과 무관한** 코드입니다.

### 분류 기준
- 비즈니스 로직과 독립적인 코드인가?
- 여러 곳에서 재사용 가능한가?
- 외부 세계(API, 라이브러리)와의 연결인가?

### 포함되어야 하는 것
| 세그먼트 | 내용 | 예시 |
|---------|------|------|
| `ui/` | 범용 UI 컴포넌트 | Button, Input, Modal, Card |
| `api/` | API 클라이언트, 요청 함수 | axios 인스턴스, fetch wrapper |
| `lib/` | 유틸리티 함수 | formatDate, debounce, cn |
| `config/` | 환경 설정, 상수 | API_URL, ROUTES, THEMES |
| `hooks/` | 범용 커스텀 훅 | useDebounce, useLocalStorage |
| `types/` | 공통 타입 정의 | ApiResponse, Pagination |

### 구조 예시
```
shared/
├── api/
│   ├── client.ts           # axios/fetch 인스턴스
│   ├── types.ts            # API 관련 타입
│   └── index.ts
├── config/
│   ├── routes.ts           # 라우트 상수
│   ├── env.ts              # 환경 변수
│   └── index.ts
├── lib/
│   ├── utils/
│   │   ├── cn.ts           # className 유틸리티
│   │   ├── format.ts       # 포맷 함수
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── index.ts
│   └── index.ts
├── ui/
│   ├── button/
│   │   ├── Button.tsx
│   │   ├── Button.module.css
│   │   └── index.ts
│   ├── input/
│   ├── modal/
│   └── index.ts
└── types/
    ├── api.ts
    └── index.ts
```

### 코드 예시
```typescript
// shared/ui/button/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(styles.button, styles[variant], styles[size])}
      {...props}
    >
      {children}
    </button>
  );
}
```

```typescript
// shared/api/client.ts
import axios from 'axios';
import { env } from '@/shared/config';

export const apiClient = axios.create({
  baseURL: env.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 공통 에러 처리
    return Promise.reject(error);
  }
);
```

### 주의사항
- ❌ 비즈니스 로직이 들어가면 안 됨
- ❌ 특정 엔티티에 종속적인 코드 금지
- ✅ 슬라이스 없이 세그먼트로만 구성
- ✅ 회사 로고, 페이지 레이아웃 등 비즈니스 테마는 OK

---

## 2. entities 계층

### 정의
프로젝트에서 다루는 **비즈니스 엔티티**를 나타냅니다. 비즈니스가 제품을 설명할 때 사용하는 용어들입니다.

### 분류 기준
- 비즈니스에서 사용하는 핵심 개념인가?
- 데이터베이스에 테이블로 존재할 수 있는 객체인가?
- 여러 기능(feature)에서 공통으로 사용되는가?

### 포함되어야 하는 것
| 세그먼트 | 내용 | 예시 |
|---------|------|------|
| `ui/` | 엔티티의 시각적 표현 | UserAvatar, ProductCard |
| `model/` | 데이터 타입, 스토어, 검증 | User 인터페이스, userStore |
| `api/` | 엔티티 관련 API 요청 | getUser, getProducts |
| `lib/` | 엔티티 관련 유틸리티 | formatUserName |

### 도메인별 엔티티 예시

#### E-Commerce
```
entities/
├── user/           # 사용자
├── product/        # 상품
├── category/       # 카테고리
├── cart/           # 장바구니
├── order/          # 주문
├── review/         # 리뷰
└── payment/        # 결제
```

#### SNS
```
entities/
├── user/           # 사용자
├── post/           # 게시글
├── comment/        # 댓글
├── like/           # 좋아요
├── follow/         # 팔로우
├── notification/   # 알림
└── message/        # 메시지
```

#### SaaS Dashboard
```
entities/
├── user/           # 사용자
├── workspace/      # 워크스페이스
├── project/        # 프로젝트
├── task/           # 태스크
├── team/           # 팀
└── billing/        # 결제
```

### 구조 예시
```
entities/
├── user/
│   ├── ui/
│   │   ├── UserAvatar.tsx
│   │   ├── UserBadge.tsx
│   │   └── index.ts
│   ├── model/
│   │   ├── types.ts         # User 타입 정의
│   │   ├── store.ts         # 상태 관리 (Zustand/Redux)
│   │   ├── selectors.ts     # 선택자
│   │   └── index.ts
│   ├── api/
│   │   ├── userApi.ts       # API 요청 함수
│   │   ├── queries.ts       # React Query hooks
│   │   └── index.ts
│   ├── lib/
│   │   ├── formatName.ts
│   │   └── index.ts
│   └── index.ts             # Public API
├── product/
│   ├── ui/
│   │   ├── ProductCard.tsx
│   │   ├── ProductImage.tsx
│   │   └── index.ts
│   ├── model/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── api/
│   │   ├── productApi.ts
│   │   └── index.ts
│   └── index.ts
└── order/
    └── ...
```

### 코드 예시
```typescript
// entities/user/model/types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
}

export type UserRole = 'admin' | 'member' | 'guest';
```

```typescript
// entities/user/ui/UserAvatar.tsx
import { User } from '../model/types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  // ❌ onClick 같은 액션은 넣지 않음 (features 계층 역할)
}

export function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  return (
    <img
      src={user.avatar || '/default-avatar.png'}
      alt={user.name}
      className={cn(styles.avatar, styles[size])}
    />
  );
}
```

```typescript
// entities/user/api/userApi.ts
import { apiClient } from '@/shared/api';
import { User } from '../model/types';

export const userApi = {
  getById: (id: string) =>
    apiClient.get<User>(`/users/${id}`),

  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<User[]>('/users', { params }),

  getCurrent: () =>
    apiClient.get<User>('/users/me'),
};
```

```typescript
// entities/user/index.ts (Public API)
// UI
export { UserAvatar } from './ui/UserAvatar';
export { UserBadge } from './ui/UserBadge';

// Model
export type { User, UserRole } from './model/types';
export { userStore, useUserStore } from './model/store';

// API
export { userApi } from './api/userApi';
export { useUser, useUsers } from './api/queries';
```

### 주의사항
- ❌ 사용자 액션(버튼 클릭 등)을 포함하면 안 됨 → features로
- ❌ 다른 entity를 직접 import하면 안 됨 → @x 표기법 사용
- ✅ UI는 순수하게 데이터 표시만 담당
- ✅ Props/Slots으로 외부에서 액션 주입 가능

---

## 3. features 계층

### 정의
**사용자에게 비즈니스 가치를 제공하는 기능**입니다. 사용자 인터랙션과 액션을 담당합니다.

### 분류 기준
- 사용자가 수행하는 구체적인 액션인가?
- 비즈니스 가치를 제공하는가?
- 여러 페이지에서 재사용될 수 있는가?

### 포함되어야 하는 것
| 세그먼트 | 내용 | 예시 |
|---------|------|------|
| `ui/` | 인터랙션 UI 컴포넌트 | LoginForm, AddToCartButton |
| `model/` | 기능 상태, 검증 로직 | 폼 상태, 유효성 검사 |
| `api/` | 기능 관련 API 요청 | login, addToCart |
| `lib/` | 기능 관련 유틸리티 | validateForm |
| `config/` | 기능 설정, 피처 플래그 | MAX_CART_ITEMS |

### 기능(Feature) 식별 가이드

#### 동사 + 명사 = Feature
```
features/
├── auth-by-email/          # 이메일로 인증하기
├── auth-by-oauth/          # OAuth로 인증하기
├── add-to-cart/            # 장바구니에 추가하기
├── remove-from-cart/       # 장바구니에서 제거하기
├── update-cart-quantity/   # 장바구니 수량 변경하기
├── checkout/               # 결제하기
├── search-products/        # 상품 검색하기
├── filter-products/        # 상품 필터링하기
├── write-review/           # 리뷰 작성하기
├── like-post/              # 게시글 좋아요
├── follow-user/            # 사용자 팔로우
└── send-message/           # 메시지 보내기
```

### 구조 예시
```
features/
├── auth-by-email/
│   ├── ui/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── index.ts
│   ├── model/
│   │   ├── types.ts
│   │   ├── validation.ts
│   │   ├── store.ts
│   │   └── index.ts
│   ├── api/
│   │   ├── authApi.ts
│   │   └── index.ts
│   └── index.ts
├── add-to-cart/
│   ├── ui/
│   │   ├── AddToCartButton.tsx
│   │   └── index.ts
│   ├── model/
│   │   ├── useAddToCart.ts
│   │   └── index.ts
│   └── index.ts
└── search-products/
    ├── ui/
    │   ├── SearchBar.tsx
    │   ├── SearchResults.tsx
    │   └── index.ts
    ├── model/
    │   ├── useSearch.ts
    │   └── index.ts
    └── index.ts
```

### 코드 예시
```typescript
// features/add-to-cart/ui/AddToCartButton.tsx
import { Button } from '@/shared/ui';
import { Product } from '@/entities/product';
import { useAddToCart } from '../model/useAddToCart';

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
}

export function AddToCartButton({
  product,
  quantity = 1
}: AddToCartButtonProps) {
  const { addToCart, isLoading } = useAddToCart();

  const handleClick = () => {
    addToCart({ productId: product.id, quantity });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || !product.inStock}
    >
      {isLoading ? '추가 중...' : '장바구니에 담기'}
    </Button>
  );
}
```

```typescript
// features/add-to-cart/model/useAddToCart.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../api/cartApi';
import { toast } from '@/shared/lib';

interface AddToCartParams {
  productId: string;
  quantity: number;
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (params: AddToCartParams) =>
      cartApi.addItem(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('장바구니에 추가되었습니다');
    },
    onError: () => {
      toast.error('추가에 실패했습니다');
    },
  });

  return {
    addToCart: mutation.mutate,
    isLoading: mutation.isPending,
  };
}
```

```typescript
// features/auth-by-email/ui/LoginForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/shared/ui';
import { loginSchema, LoginFormData } from '../model/validation';
import { useLogin } from '../model/useLogin';

export function LoginForm() {
  const { login, isLoading } = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(login)}>
      <Input
        {...register('email')}
        type="email"
        placeholder="이메일"
        error={errors.email?.message}
      />
      <Input
        {...register('password')}
        type="password"
        placeholder="비밀번호"
        error={errors.password?.message}
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}
```

### 주의사항
- ❌ 모든 것을 feature로 만들지 않기 (중요한 것만)
- ❌ feature끼리 서로 import 금지
- ✅ entities와 shared만 import 가능
- ✅ 재사용 가능성이 있을 때 feature로 분리

---

## 4. widgets 계층

### 정의
**entities와 features를 조합한 독립적인 대형 UI 블록**입니다. 페이지의 구성 요소가 됩니다.

### 분류 기준
- entities와 features의 조합인가?
- 여러 페이지에서 재사용되는가?
- 독립적으로 동작할 수 있는 큰 블록인가?

### 포함되어야 하는 것
| 세그먼트 | 내용 | 예시 |
|---------|------|------|
| `ui/` | 조합된 UI 컴포넌트 | Header, ProductList |
| `model/` | 위젯 상태 | 테마, 레이아웃 상태 |
| `lib/` | 위젯 유틸리티 | 레이아웃 계산 |

### Widget 식별 가이드

```
widgets/
├── header/                 # 헤더 (로고 + 네비게이션 + 검색 + 사용자메뉴)
├── footer/                 # 푸터
├── sidebar/                # 사이드바
├── product-list/           # 상품 목록 (상품카드 + 필터 + 정렬)
├── product-details/        # 상품 상세 (이미지 + 정보 + 장바구니버튼)
├── cart-widget/            # 장바구니 위젯 (미니 장바구니)
├── user-profile/           # 사용자 프로필 블록
├── comment-section/        # 댓글 섹션
├── notification-center/    # 알림 센터
└── theme-provider/         # 테마 프로바이더
```

### 구조 예시
```
widgets/
├── header/
│   ├── ui/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   ├── UserMenu.tsx
│   │   └── index.ts
│   ├── model/
│   │   ├── useHeader.ts
│   │   └── index.ts
│   └── index.ts
├── product-list/
│   ├── ui/
│   │   ├── ProductList.tsx
│   │   ├── ProductGrid.tsx
│   │   └── index.ts
│   └── index.ts
└── cart-widget/
    ├── ui/
    │   ├── CartWidget.tsx
    │   ├── CartItem.tsx
    │   └── index.ts
    └── index.ts
```

### 코드 예시
```typescript
// widgets/header/ui/Header.tsx
import { Logo } from '@/shared/ui';
import { SearchProducts } from '@/features/search-products';
import { UserAvatar, useUser } from '@/entities/user';
import { CartWidget } from '@/widgets/cart-widget';
import { Navigation } from './Navigation';
import { UserMenu } from './UserMenu';

export function Header() {
  const { user } = useUser();

  return (
    <header className={styles.header}>
      <Logo />
      <Navigation />
      <SearchProducts />
      <CartWidget />
      {user ? (
        <UserMenu user={user} />
      ) : (
        <LoginButton />
      )}
    </header>
  );
}
```

```typescript
// widgets/product-list/ui/ProductList.tsx
import { ProductCard, Product } from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart';
import { LikeButton } from '@/features/like-product';

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          // Features를 slots/props로 주입
          actions={
            <>
              <AddToCartButton product={product} />
              <LikeButton productId={product.id} />
            </>
          }
        />
      ))}
    </div>
  );
}
```

### 주의사항
- ❌ 한 페이지에서만 사용되고 재사용 안 되면 widget이 아님 → page에 직접 작성
- ✅ features, entities, shared를 조합
- ✅ widget끼리도 서로 사용 가능

---

## 5. pages 계층 (FSD)

### 정의
**전체 페이지 또는 라우트의 대부분을 차지하는 컴포넌트**입니다.

### 분류 기준
- 하나의 라우트에 해당하는가?
- 페이지 전체의 레이아웃과 구성을 담당하는가?

### 구조 예시
```
src/pages/                  # FSD pages 계층
├── home/
│   ├── ui/
│   │   ├── HomePage.tsx
│   │   └── index.ts
│   └── index.ts
├── product-detail/
│   ├── ui/
│   │   ├── ProductDetailPage.tsx
│   │   └── index.ts
│   └── index.ts
├── cart/
│   ├── ui/
│   │   ├── CartPage.tsx
│   │   └── index.ts
│   └── index.ts
└── checkout/
    ├── ui/
    │   ├── CheckoutPage.tsx
    │   └── index.ts
    └── index.ts
```

### 코드 예시
```typescript
// src/pages/home/ui/HomePage.tsx
import { Header, Footer } from '@/widgets/header';
import { ProductList } from '@/widgets/product-list';
import { CategoryFilter } from '@/features/filter-products';
import { useProducts } from '@/entities/product';

export function HomePage() {
  const { products, isLoading } = useProducts();

  return (
    <>
      <Header />
      <main>
        <h1>인기 상품</h1>
        <CategoryFilter />
        {isLoading ? (
          <Loading />
        ) : (
          <ProductList products={products} />
        )}
      </main>
      <Footer />
    </>
  );
}
```

---

## 6. app 계층

### 정의
**앱 전체의 설정, 초기화, 프로바이더**를 담당합니다.

### 분류 기준
- 앱 전체에 영향을 미치는 설정인가?
- 프로바이더, 라우터, 글로벌 스타일인가?

### 구조 예시 (Next.js)
```
src/app/                    # FSD app 계층
├── providers/
│   ├── QueryProvider.tsx
│   ├── ThemeProvider.tsx
│   ├── AuthProvider.tsx
│   └── index.ts
├── styles/
│   ├── globals.css
│   ├── variables.css
│   └── index.ts
└── index.ts
```

### 코드 예시
```typescript
// src/app/providers/Providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

---

## 계층 선택 의사결정 플로우차트

```
코드를 어디에 놓을지 결정하기:

┌─────────────────────────────────────────┐
│ 1. 비즈니스 로직과 무관한 범용 코드인가?    │
│    (UI 컴포넌트, 유틸리티, API 클라이언트)  │
└────────────────┬────────────────────────┘
                 │
        Yes ─────┼───── No
         │       │       │
         ▼       │       ▼
    ┌────────┐   │  ┌────────────────────────────────┐
    │ shared │   │  │ 2. 비즈니스 도메인 객체인가?      │
    └────────┘   │  │    (User, Product, Order 등)    │
                 │  └───────────────┬────────────────┘
                 │                  │
                 │         Yes ─────┼───── No
                 │          │       │       │
                 │          ▼       │       ▼
                 │     ┌──────────┐ │  ┌──────────────────────┐
                 │     │ entities │ │  │ 3. 사용자 액션/기능인가? │
                 │     └──────────┘ │  │    (버튼 클릭, 폼 제출) │
                 │                  │  └───────────┬──────────┘
                 │                  │              │
                 │                  │     Yes ─────┼───── No
                 │                  │      │       │       │
                 │                  │      ▼       │       ▼
                 │                  │ ┌──────────┐ │  ┌─────────────────────┐
                 │                  │ │ features │ │  │ 4. 여러 페이지에서    │
                 │                  │ └──────────┘ │  │    재사용되는 블록?   │
                 │                  │              │  └──────────┬──────────┘
                 │                  │              │             │
                 │                  │              │    Yes ─────┼───── No
                 │                  │              │     │       │       │
                 │                  │              │     ▼       │       ▼
                 │                  │              │ ┌─────────┐ │  ┌───────┐
                 │                  │              │ │ widgets │ │  │ pages │
                 │                  │              │ └─────────┘ │  └───────┘
```

---

## 다음 단계

- [슬라이스와 세그먼트 상세 가이드](./03-slices-segments.md)
- [Public API 설계](./04-public-api.md)
