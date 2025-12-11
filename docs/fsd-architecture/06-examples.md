# 6. 실전 예시 및 베스트 프랙티스

## E-Commerce 프로젝트 전체 구조

```
my-ecommerce/
├── app/                          # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                  # → HomePage
│   ├── loading.tsx
│   ├── error.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx        # → LoginPage
│   │   └── register/page.tsx     # → RegisterPage
│   ├── products/
│   │   ├── page.tsx              # → ProductListPage
│   │   └── [id]/page.tsx         # → ProductDetailPage
│   ├── cart/page.tsx             # → CartPage
│   ├── checkout/page.tsx         # → CheckoutPage
│   └── api/
│       ├── auth/[...]/route.ts
│       └── products/[...]/route.ts
│
├── pages/                        # 빈 폴더 (필수)
│   └── README.md
│
├── src/
│   ├── app/                      # FSD App
│   │   ├── providers/
│   │   │   ├── QueryProvider.tsx
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── CartProvider.tsx
│   │   │   ├── Providers.tsx
│   │   │   └── index.ts
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── variables.css
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── pages/                    # FSD Pages
│   │   ├── home/
│   │   │   ├── ui/HomePage.tsx
│   │   │   └── index.ts
│   │   ├── product-list/
│   │   │   ├── ui/ProductListPage.tsx
│   │   │   └── index.ts
│   │   ├── product-detail/
│   │   │   ├── ui/ProductDetailPage.tsx
│   │   │   └── index.ts
│   │   ├── cart/
│   │   │   ├── ui/CartPage.tsx
│   │   │   └── index.ts
│   │   ├── checkout/
│   │   │   ├── ui/CheckoutPage.tsx
│   │   │   └── index.ts
│   │   └── auth/
│   │       ├── ui/
│   │       │   ├── LoginPage.tsx
│   │       │   └── RegisterPage.tsx
│   │       └── index.ts
│   │
│   ├── widgets/                  # FSD Widgets
│   │   ├── header/
│   │   │   ├── ui/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   ├── CartIcon.tsx
│   │   │   │   └── UserMenu.tsx
│   │   │   └── index.ts
│   │   ├── footer/
│   │   │   ├── ui/Footer.tsx
│   │   │   └── index.ts
│   │   ├── product-list/
│   │   │   ├── ui/
│   │   │   │   ├── ProductGrid.tsx
│   │   │   │   └── ProductFilters.tsx
│   │   │   └── index.ts
│   │   ├── product-details/
│   │   │   ├── ui/ProductDetails.tsx
│   │   │   └── index.ts
│   │   ├── cart-summary/
│   │   │   ├── ui/CartSummary.tsx
│   │   │   └── index.ts
│   │   └── checkout-form/
│   │       ├── ui/CheckoutForm.tsx
│   │       └── index.ts
│   │
│   ├── features/                 # FSD Features
│   │   ├── auth/
│   │   │   ├── by-email/
│   │   │   │   ├── ui/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   └── RegisterForm.tsx
│   │   │   │   ├── model/
│   │   │   │   │   ├── useLogin.ts
│   │   │   │   │   ├── useRegister.ts
│   │   │   │   │   └── validation.ts
│   │   │   │   ├── api/authApi.ts
│   │   │   │   └── index.ts
│   │   │   └── by-oauth/
│   │   │       ├── ui/OAuthButtons.tsx
│   │   │       └── index.ts
│   │   ├── cart/
│   │   │   ├── add-to-cart/
│   │   │   │   ├── ui/AddToCartButton.tsx
│   │   │   │   ├── model/useAddToCart.ts
│   │   │   │   └── index.ts
│   │   │   ├── remove-from-cart/
│   │   │   │   ├── ui/RemoveButton.tsx
│   │   │   │   └── index.ts
│   │   │   └── update-quantity/
│   │   │       ├── ui/QuantitySelector.tsx
│   │   │       └── index.ts
│   │   ├── product/
│   │   │   ├── search/
│   │   │   │   ├── ui/SearchBar.tsx
│   │   │   │   ├── model/useSearch.ts
│   │   │   │   └── index.ts
│   │   │   ├── filter/
│   │   │   │   ├── ui/FilterPanel.tsx
│   │   │   │   └── index.ts
│   │   │   └── sort/
│   │   │       ├── ui/SortSelect.tsx
│   │   │       └── index.ts
│   │   └── review/
│   │       ├── write-review/
│   │       │   ├── ui/ReviewForm.tsx
│   │       │   └── index.ts
│   │       └── rate-product/
│   │           └── index.ts
│   │
│   ├── entities/                 # FSD Entities
│   │   ├── user/
│   │   │   ├── ui/
│   │   │   │   ├── UserAvatar.tsx
│   │   │   │   ├── UserBadge.tsx
│   │   │   │   └── index.ts
│   │   │   ├── model/
│   │   │   │   ├── types.ts
│   │   │   │   ├── store.ts
│   │   │   │   └── index.ts
│   │   │   ├── api/
│   │   │   │   ├── userApi.ts
│   │   │   │   ├── queries.ts
│   │   │   │   └── index.ts
│   │   │   ├── @x/
│   │   │   │   └── order.ts
│   │   │   └── index.ts
│   │   ├── product/
│   │   │   ├── ui/
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductImage.tsx
│   │   │   │   ├── ProductPrice.tsx
│   │   │   │   └── index.ts
│   │   │   ├── model/
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts
│   │   │   ├── api/
│   │   │   │   ├── productApi.ts
│   │   │   │   ├── queries.ts
│   │   │   │   └── index.ts
│   │   │   ├── @x/
│   │   │   │   ├── cart.ts
│   │   │   │   └── order.ts
│   │   │   └── index.ts
│   │   ├── cart/
│   │   │   ├── ui/
│   │   │   │   ├── CartItem.tsx
│   │   │   │   └── index.ts
│   │   │   ├── model/
│   │   │   │   ├── types.ts
│   │   │   │   ├── store.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── order/
│   │   │   ├── model/types.ts
│   │   │   ├── api/
│   │   │   └── index.ts
│   │   └── category/
│   │       ├── model/types.ts
│   │       ├── api/
│   │       └── index.ts
│   │
│   └── shared/                   # FSD Shared
│       ├── ui/
│       │   ├── button/
│       │   │   ├── Button.tsx
│       │   │   ├── Button.module.css
│       │   │   └── index.ts
│       │   ├── input/
│       │   ├── select/
│       │   ├── modal/
│       │   ├── card/
│       │   ├── badge/
│       │   ├── spinner/
│       │   ├── skeleton/
│       │   ├── toast/
│       │   ├── layout/
│       │   │   ├── Container.tsx
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── api/
│       │   ├── client.ts
│       │   ├── types.ts
│       │   └── index.ts
│       ├── lib/
│       │   ├── hooks/
│       │   │   ├── useDebounce.ts
│       │   │   ├── useLocalStorage.ts
│       │   │   ├── useMediaQuery.ts
│       │   │   └── index.ts
│       │   ├── utils/
│       │   │   ├── cn.ts
│       │   │   ├── format.ts
│       │   │   ├── currency.ts
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── config/
│       │   ├── env.ts
│       │   ├── routes.ts
│       │   ├── constants.ts
│       │   └── index.ts
│       └── types/
│           ├── api.ts
│           └── index.ts
│
├── public/
├── tsconfig.json
├── next.config.js
├── .eslintrc.js
└── package.json
```

---

## 주요 코드 예시

### entities/product 전체 구현

```typescript
// entities/product/model/types.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: ProductCategory;
  stock: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

export type ProductSortOption =
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'rating'
  | 'popular';
```

```typescript
// entities/product/model/index.ts
export type {
  Product,
  ProductCategory,
  ProductFilters,
  ProductSortOption,
} from './types';
```

```typescript
// entities/product/api/productApi.ts
import { apiClient } from '@/shared/api';
import type { Product, ProductFilters } from '../model/types';

interface GetProductsParams extends ProductFilters {
  page?: number;
  limit?: number;
  sort?: string;
}

interface GetProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export const productApi = {
  getAll: async (params?: GetProductsParams): Promise<GetProductsResponse> => {
    const { data } = await apiClient.get('/products', { params });
    return data;
  },

  getById: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  },

  getByCategory: async (categorySlug: string): Promise<Product[]> => {
    const { data } = await apiClient.get(`/products/category/${categorySlug}`);
    return data;
  },

  search: async (query: string): Promise<Product[]> => {
    const { data } = await apiClient.get('/products/search', {
      params: { q: query },
    });
    return data;
  },
};
```

```typescript
// entities/product/api/queries.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { productApi } from './productApi';
import type { ProductFilters } from '../model/types';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters ?? {}),
    queryFn: () => productApi.getAll(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productApi.getById(id),
    enabled: !!id,
  });
}

export function useInfiniteProducts(filters?: ProductFilters) {
  return useInfiniteQuery({
    queryKey: productKeys.list(filters ?? {}),
    queryFn: ({ pageParam = 1 }) =>
      productApi.getAll({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}
```

```typescript
// entities/product/api/index.ts
export { productApi } from './productApi';
export { useProducts, useProduct, useInfiniteProducts, productKeys } from './queries';
```

```typescript
// entities/product/ui/ProductCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Card, Badge } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib';
import type { Product } from '../model/types';
import { ProductPrice } from './ProductPrice';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  actions?: React.ReactNode;  // Slot for features (AddToCart, Like, etc.)
}

export function ProductCard({ product, actions }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <Card className={styles.card}>
      <Link href={`/products/${product.id}`} className={styles.imageWrapper}>
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className={styles.image}
        />
        {isOutOfStock && (
          <Badge variant="error" className={styles.stockBadge}>
            품절
          </Badge>
        )}
        {hasDiscount && (
          <Badge variant="primary" className={styles.discountBadge}>
            {Math.round((1 - product.price / product.originalPrice!) * 100)}%
          </Badge>
        )}
      </Link>

      <div className={styles.content}>
        <span className={styles.category}>{product.category.name}</span>
        <Link href={`/products/${product.id}`}>
          <h3 className={styles.name}>{product.name}</h3>
        </Link>
        <ProductPrice
          price={product.price}
          originalPrice={product.originalPrice}
        />
        <div className={styles.rating}>
          ⭐ {product.rating.toFixed(1)} ({product.reviewCount})
        </div>
      </div>

      {actions && (
        <div className={styles.actions}>
          {actions}
        </div>
      )}
    </Card>
  );
}
```

```typescript
// entities/product/ui/ProductPrice.tsx
import { formatCurrency } from '@/shared/lib';
import styles from './ProductPrice.module.css';

interface ProductPriceProps {
  price: number;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ProductPrice({
  price,
  originalPrice,
  size = 'md',
}: ProductPriceProps) {
  const hasDiscount = originalPrice && originalPrice > price;

  return (
    <div className={`${styles.price} ${styles[size]}`}>
      {hasDiscount && (
        <span className={styles.original}>
          {formatCurrency(originalPrice)}
        </span>
      )}
      <span className={styles.current}>
        {formatCurrency(price)}
      </span>
    </div>
  );
}
```

```typescript
// entities/product/ui/index.ts
export { ProductCard } from './ProductCard';
export { ProductImage } from './ProductImage';
export { ProductPrice } from './ProductPrice';
```

```typescript
// entities/product/index.ts (Public API)

// UI Components
export { ProductCard } from './ui/ProductCard';
export { ProductImage } from './ui/ProductImage';
export { ProductPrice } from './ui/ProductPrice';

// Types
export type {
  Product,
  ProductCategory,
  ProductFilters,
  ProductSortOption,
} from './model';

// API & Queries
export { productApi } from './api';
export { useProducts, useProduct, useInfiniteProducts, productKeys } from './api';
```

---

### features/cart/add-to-cart 전체 구현

```typescript
// features/cart/add-to-cart/model/useAddToCart.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '@/entities/cart';
import { toast } from '@/shared/lib';

interface AddToCartParams {
  productId: string;
  quantity: number;
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const addItem = useCartStore((state) => state.addItem);

  const mutation = useMutation({
    mutationFn: async ({ productId, quantity }: AddToCartParams) => {
      // 로컬 상태 업데이트 (Optimistic)
      addItem(productId, quantity);

      // API 호출 (서버 동기화가 필요한 경우)
      // await cartApi.addItem({ productId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('장바구니에 추가되었습니다');
    },
    onError: (error) => {
      toast.error('추가에 실패했습니다');
      console.error(error);
    },
  });

  return {
    addToCart: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
  };
}
```

```typescript
// features/cart/add-to-cart/ui/AddToCartButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui';
import type { Product } from '@/entities/product';
import { useAddToCart } from '../model/useAddToCart';
import { QuantityInput } from './QuantityInput';
import styles from './AddToCartButton.module.css';

interface AddToCartButtonProps {
  product: Product;
  showQuantity?: boolean;
  variant?: 'default' | 'compact';
}

export function AddToCartButton({
  product,
  showQuantity = false,
  variant = 'default',
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isLoading } = useAddToCart();

  const handleClick = () => {
    addToCart({
      productId: product.id,
      quantity,
    });
  };

  const isDisabled = isLoading || product.stock === 0;

  if (variant === 'compact') {
    return (
      <Button
        size="sm"
        onClick={handleClick}
        disabled={isDisabled}
        className={styles.compactButton}
      >
        {isLoading ? '...' : '담기'}
      </Button>
    );
  }

  return (
    <div className={styles.container}>
      {showQuantity && (
        <QuantityInput
          value={quantity}
          onChange={setQuantity}
          max={product.stock}
          disabled={isLoading}
        />
      )}
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        fullWidth
      >
        {isLoading ? '추가 중...' : product.stock === 0 ? '품절' : '장바구니에 담기'}
      </Button>
    </div>
  );
}
```

```typescript
// features/cart/add-to-cart/index.ts
export { AddToCartButton } from './ui/AddToCartButton';
export { useAddToCart } from './model/useAddToCart';
```

---

### widgets/product-list 전체 구현

```typescript
// widgets/product-list/ui/ProductGrid.tsx
'use client';

import { ProductCard, useProducts, type ProductFilters } from '@/entities/product';
import { AddToCartButton } from '@/features/cart/add-to-cart';
import { LikeButton } from '@/features/product/like';
import { Skeleton } from '@/shared/ui';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  filters?: ProductFilters;
}

export function ProductGrid({ filters }: ProductGridProps) {
  const { data, isLoading, error } = useProducts(filters);

  if (isLoading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>상품을 불러오는데 실패했습니다.</div>;
  }

  if (!data?.products.length) {
    return <div className={styles.empty}>상품이 없습니다.</div>;
  }

  return (
    <div className={styles.grid}>
      {data.products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          actions={
            <div className={styles.actions}>
              <AddToCartButton product={product} variant="compact" />
              <LikeButton productId={product.id} />
            </div>
          }
        />
      ))}
    </div>
  );
}
```

```typescript
// widgets/product-list/ui/ProductListWidget.tsx
'use client';

import { useState } from 'react';
import type { ProductFilters, ProductSortOption } from '@/entities/product';
import { FilterPanel } from '@/features/product/filter';
import { SortSelect } from '@/features/product/sort';
import { ProductGrid } from './ProductGrid';
import styles from './ProductListWidget.module.css';

export function ProductListWidget() {
  const [filters, setFilters] = useState<ProductFilters>({});
  const [sort, setSort] = useState<ProductSortOption>('newest');

  const handleFilterChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
        />
      </aside>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <SortSelect value={sort} onChange={setSort} />
        </div>
        <ProductGrid filters={{ ...filters, sort }} />
      </main>
    </div>
  );
}
```

```typescript
// widgets/product-list/index.ts
export { ProductGrid } from './ui/ProductGrid';
export { ProductListWidget } from './ui/ProductListWidget';
```

---

## 자주 하는 실수와 해결 방법

### 실수 1: 모든 것을 Feature로 만들기

```typescript
// ❌ 잘못됨: 너무 작은 것도 feature로
features/
├── show-product-name/      # 불필요
├── display-price/          # 불필요
├── render-image/           # 불필요
└── format-date/            # 불필요

// ✅ 올바름: 비즈니스 가치가 있는 것만 feature로
features/
├── add-to-cart/           # 장바구니 추가
├── checkout/              # 결제
├── write-review/          # 리뷰 작성
└── search-products/       # 상품 검색
```

### 실수 2: Entity에 액션 포함하기

```typescript
// ❌ 잘못됨: Entity에 사용자 액션 포함
// entities/product/ui/ProductCard.tsx
export function ProductCard({ product }) {
  const handleAddToCart = () => { /* ... */ };  // 이건 feature!

  return (
    <div>
      {/* ... */}
      <button onClick={handleAddToCart}>장바구니 담기</button>
    </div>
  );
}

// ✅ 올바름: Slots/Props로 액션 주입
// entities/product/ui/ProductCard.tsx
export function ProductCard({ product, actions }) {
  return (
    <div>
      {/* ... */}
      {actions}  {/* 외부에서 주입 */}
    </div>
  );
}

// widgets에서 조합
<ProductCard
  product={product}
  actions={<AddToCartButton product={product} />}
/>
```

### 실수 3: Shared에 비즈니스 로직 넣기

```typescript
// ❌ 잘못됨: 비즈니스 로직이 shared에
// shared/lib/calculateDiscount.ts
export function calculateDiscount(product: Product) {
  // 상품에 종속된 로직 - shared가 아님!
}

// ✅ 올바름: 범용 유틸리티만 shared에
// shared/lib/utils/percentage.ts
export function calculatePercentage(part: number, total: number) {
  return Math.round((part / total) * 100);
}

// 비즈니스 로직은 entities/product/lib에
// entities/product/lib/calculateDiscount.ts
export function calculateDiscount(product: Product) {
  // ...
}
```

### 실수 4: 상위 계층 import

```typescript
// ❌ 잘못됨: Entity에서 Feature import
// entities/user/ui/UserCard.tsx
import { FollowButton } from '@/features/follow-user';  // 금지!

// ✅ 올바름: Slots 패턴 사용
// entities/user/ui/UserCard.tsx
interface UserCardProps {
  user: User;
  actions?: React.ReactNode;  // Slot
}

// widgets에서 조합
<UserCard
  user={user}
  actions={<FollowButton userId={user.id} />}
/>
```

---

## 체크리스트

### 새 코드 추가 시

- [ ] 적절한 계층에 배치했는가?
- [ ] 단방향 의존성 규칙을 지켰는가?
- [ ] 같은 계층의 다른 슬라이스를 import하지 않았는가?
- [ ] Public API(index.ts)를 통해 export했는가?
- [ ] 비즈니스 로직이 shared에 들어가지 않았는가?

### 코드 리뷰 시

- [ ] Import 경로가 Public API를 통하는가?
- [ ] Entity에 사용자 액션이 포함되어 있지 않은가?
- [ ] Feature가 정말 재사용 가능한 기능인가?
- [ ] Widget이 entities + features의 조합인가?
- [ ] 'use client'가 필요한 곳에만 있는가?

---

## 참고 자료

### 공식 문서
- [Feature-Sliced Design 공식](https://feature-sliced.design/)
- [Next.js와 FSD 통합](https://feature-sliced.design/docs/guides/tech/with-nextjs)
- [FSD GitHub](https://github.com/feature-sliced)

### 커뮤니티
- [FSD Telegram](https://t.me/feature_sliced)
- [FSD Discord](https://discord.gg/S8MzWTUsmp)

### 예시 프로젝트
- [GitHub Client Example](https://github.com/feature-sliced/examples)
- [Next.js FSD Template](https://github.com/yunglocokid/FSD-Pure-Next.js-Template)

---

*이 문서는 팀의 아키텍처 표준 가이드입니다. 질문이나 개선 사항은 팀 리드에게 문의하세요.*
