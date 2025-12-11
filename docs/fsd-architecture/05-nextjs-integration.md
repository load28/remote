# 5. Next.js App Router와 FSD 통합 가이드

## 핵심 충돌 문제

Next.js App Router와 FSD는 폴더명이 충돌합니다:

| FSD 계층 | Next.js App Router |
|----------|-------------------|
| `app/` (앱 초기화) | `app/` (라우팅) |
| `pages/` (페이지 컴포넌트) | `pages/` (Pages Router) |

## 권장 프로젝트 구조

### 해결책: Next.js `app/`을 루트에, FSD를 `src/`에 배치

```
my-nextjs-project/
├── app/                        # 🔵 Next.js App Router (루트)
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 홈페이지
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── (auth)/                 # 라우트 그룹
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── products/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── cart/
│   │   └── page.tsx
│   └── api/                    # Route Handlers
│       └── [...]/
│
├── pages/                      # 🔴 빈 폴더 (필수!)
│   └── README.md               # 왜 비어있는지 설명
│
├── src/                        # 🟢 FSD 구조
│   ├── app/                    # FSD app 계층
│   │   ├── providers/
│   │   ├── styles/
│   │   └── index.ts
│   ├── pages/                  # FSD pages 계층
│   │   ├── home/
│   │   ├── product-detail/
│   │   └── cart/
│   ├── widgets/
│   │   ├── header/
│   │   ├── footer/
│   │   └── product-list/
│   ├── features/
│   │   ├── auth-by-email/
│   │   └── add-to-cart/
│   ├── entities/
│   │   ├── user/
│   │   └── product/
│   └── shared/
│       ├── ui/
│       ├── api/
│       └── lib/
│
├── public/
├── tsconfig.json
├── next.config.js
└── package.json
```

### 빈 `pages/` 폴더가 필요한 이유

Next.js는 `src/pages`가 있으면 Pages Router로 인식합니다. 루트에 빈 `pages/` 폴더를 두면 Next.js가 이를 Pages Router로 인식하고 `src/pages`를 무시합니다.

```markdown
<!-- pages/README.md -->
# 이 폴더는 비어 있어야 합니다

Next.js App Router와 FSD를 함께 사용하기 위해 이 폴더가 필요합니다.
이 폴더가 없으면 Next.js가 `src/pages`를 Pages Router로 인식하여 빌드 에러가 발생합니다.

**절대 삭제하지 마세요!**
```

---

## Next.js App Router 라우팅 파일 작성

### 원칙: App Router는 라우팅만, 로직은 FSD에서

```typescript
// app/page.tsx
// ✅ 올바름: FSD pages에서 import
import { HomePage } from '@/pages/home';

export default function Page() {
  return <HomePage />;
}
```

```typescript
// app/products/page.tsx
import { ProductListPage } from '@/pages/product-list';

export default function Page() {
  return <ProductListPage />;
}
```

```typescript
// app/products/[id]/page.tsx
import { ProductDetailPage } from '@/pages/product-detail';

interface Props {
  params: { id: string };
}

export default function Page({ params }: Props) {
  return <ProductDetailPage productId={params.id} />;
}
```

### 레이아웃 설정

```typescript
// app/layout.tsx
import { Providers } from '@/app/providers';
import '@/app/styles/globals.css';

export const metadata = {
  title: 'My App',
  description: 'Description',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

---

## FSD 계층별 구현

### src/app (FSD App 계층)

```
src/app/
├── providers/
│   ├── QueryProvider.tsx
│   ├── ThemeProvider.tsx
│   ├── AuthProvider.tsx
│   ├── Providers.tsx           # 모든 프로바이더 조합
│   └── index.ts
├── styles/
│   ├── globals.css
│   ├── variables.css
│   └── index.ts
└── index.ts
```

```typescript
// src/app/providers/QueryProvider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

```typescript
// src/app/providers/Providers.tsx
'use client';

import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
```

```typescript
// src/app/providers/index.ts
export { Providers } from './Providers';
export { QueryProvider } from './QueryProvider';
export { ThemeProvider } from './ThemeProvider';
export { AuthProvider } from './AuthProvider';
```

### src/pages (FSD Pages 계층)

```
src/pages/
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
└── cart/
    ├── ui/
    │   ├── CartPage.tsx
    │   └── index.ts
    └── index.ts
```

```typescript
// src/pages/home/ui/HomePage.tsx
import { Header, Footer } from '@/widgets/header';
import { ProductList } from '@/widgets/product-list';
import { HeroBanner } from './HeroBanner';

export function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroBanner />
        <section>
          <h2>인기 상품</h2>
          <ProductList />
        </section>
      </main>
      <Footer />
    </>
  );
}
```

```typescript
// src/pages/home/index.ts
export { HomePage } from './ui/HomePage';
```

```typescript
// src/pages/product-detail/ui/ProductDetailPage.tsx
import { Header, Footer } from '@/widgets/header';
import { ProductDetails } from '@/widgets/product-details';
import { RelatedProducts } from '@/widgets/related-products';

interface ProductDetailPageProps {
  productId: string;
}

export function ProductDetailPage({ productId }: ProductDetailPageProps) {
  return (
    <>
      <Header />
      <main>
        <ProductDetails productId={productId} />
        <RelatedProducts productId={productId} />
      </main>
      <Footer />
    </>
  );
}
```

### src/widgets

```
src/widgets/
├── header/
│   ├── ui/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   ├── UserMenu.tsx
│   │   └── index.ts
│   └── index.ts
├── product-list/
│   ├── ui/
│   │   ├── ProductList.tsx
│   │   └── index.ts
│   ├── model/
│   │   ├── useProductList.ts
│   │   └── index.ts
│   └── index.ts
└── product-details/
    └── ...
```

```typescript
// src/widgets/header/ui/Header.tsx
'use client';

import Link from 'next/link';
import { Logo } from '@/shared/ui';
import { SearchProducts } from '@/features/search-products';
import { useCurrentUser } from '@/entities/user';
import { Navigation } from './Navigation';
import { UserMenu } from './UserMenu';
import styles from './Header.module.css';

export function Header() {
  const { data: user, isLoading } = useCurrentUser();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/">
          <Logo />
        </Link>
        <Navigation />
        <SearchProducts />
        <div className={styles.actions}>
          {isLoading ? (
            <span>로딩중...</span>
          ) : user ? (
            <UserMenu user={user} />
          ) : (
            <Link href="/login">로그인</Link>
          )}
        </div>
      </div>
    </header>
  );
}
```

### src/features

```
src/features/
├── auth-by-email/
│   ├── ui/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── index.ts
│   ├── model/
│   │   ├── useLogin.ts
│   │   ├── useRegister.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   ├── api/
│   │   ├── authApi.ts
│   │   └── index.ts
│   └── index.ts
└── add-to-cart/
    ├── ui/
    │   ├── AddToCartButton.tsx
    │   └── index.ts
    ├── model/
    │   ├── useAddToCart.ts
    │   └── index.ts
    └── index.ts
```

```typescript
// src/features/auth-by-email/ui/LoginForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/shared/ui';
import { loginSchema, type LoginFormData } from '../model/validation';
import { useLogin } from '../model/useLogin';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await login(data);
    if (result.success) {
      router.push('/');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
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
      {error && <p className={styles.error}>{error}</p>}
      <Button type="submit" disabled={isLoading} fullWidth>
        {isLoading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}
```

### src/entities

```
src/entities/
├── user/
│   ├── ui/
│   │   ├── UserAvatar.tsx
│   │   ├── UserCard.tsx
│   │   └── index.ts
│   ├── model/
│   │   ├── types.ts
│   │   ├── store.ts
│   │   └── index.ts
│   ├── api/
│   │   ├── userApi.ts
│   │   ├── queries.ts
│   │   └── index.ts
│   └── index.ts
└── product/
    ├── ui/
    │   ├── ProductCard.tsx
    │   ├── ProductImage.tsx
    │   ├── ProductPrice.tsx
    │   └── index.ts
    ├── model/
    │   ├── types.ts
    │   └── index.ts
    ├── api/
    │   ├── productApi.ts
    │   ├── queries.ts
    │   └── index.ts
    └── index.ts
```

### src/shared

```
src/shared/
├── ui/
│   ├── button/
│   │   ├── Button.tsx
│   │   ├── Button.module.css
│   │   └── index.ts
│   ├── input/
│   ├── modal/
│   ├── card/
│   ├── logo/
│   └── index.ts
├── api/
│   ├── client.ts
│   ├── types.ts
│   └── index.ts
├── lib/
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── format.ts
│   │   └── index.ts
│   └── index.ts
├── config/
│   ├── env.ts
│   ├── routes.ts
│   └── index.ts
└── types/
    ├── api.ts
    └── index.ts
```

---

## TypeScript 설정

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
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
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Server Components vs Client Components

### 원칙

- **Server Components**: 데이터 페칭, 정적 UI
- **Client Components**: 인터랙션, 상태 관리, 이벤트 핸들러

### FSD에서의 적용

```typescript
// src/widgets/product-list/ui/ProductList.tsx
// Server Component (기본값) - 데이터 페칭
import { ProductCard, productApi } from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart';

export async function ProductList() {
  // 서버에서 데이터 페칭
  const products = await productApi.getAll();

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          actions={<AddToCartButton product={product} />}
        />
      ))}
    </div>
  );
}
```

```typescript
// src/features/add-to-cart/ui/AddToCartButton.tsx
'use client'; // 클라이언트 컴포넌트

import { Button } from '@/shared/ui';
import { Product } from '@/entities/product';
import { useAddToCart } from '../model/useAddToCart';

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart, isLoading } = useAddToCart();

  return (
    <Button onClick={() => addToCart(product.id)} disabled={isLoading}>
      {isLoading ? '추가 중...' : '장바구니에 담기'}
    </Button>
  );
}
```

### 'use client' 배치 전략

```
entities/product/
├── ui/
│   ├── ProductCard.tsx           # Server Component
│   ├── ProductImage.tsx          # Server Component
│   └── ProductQuantitySelector.tsx  # 'use client' - 인터랙션 있음
├── model/
│   └── types.ts                  # 타입만 - 컴포넌트 아님
└── api/
    └── queries.ts                # 'use client' - React Query 훅
```

---

## Route Handlers (API Routes)

Next.js Route Handlers는 `app/api/` 디렉토리에 배치합니다:

```
app/
└── api/
    ├── auth/
    │   ├── login/
    │   │   └── route.ts
    │   ├── logout/
    │   │   └── route.ts
    │   └── me/
    │       └── route.ts
    ├── products/
    │   ├── route.ts              # GET /api/products, POST /api/products
    │   └── [id]/
    │       └── route.ts          # GET /api/products/:id
    └── cart/
        └── route.ts
```

```typescript
// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { productService } from '@/entities/product/api/service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  const products = await productService.getAll({ category });

  return NextResponse.json(products);
}
```

---

## 다음 단계

- [실전 예시 코드](./06-examples.md)
