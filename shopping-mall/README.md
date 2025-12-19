# Shopping Mall Mobile WebView

Next.js와 Hasura를 사용한 모바일 쇼핑몰 웹뷰 애플리케이션입니다.

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Hasura GraphQL Engine
- **Database**: PostgreSQL
- **State Management**: Jotai, TanStack Query
- **Styling**: CSS Modules
- **Icons**: Lucide React

## 시작하기

### 1. 의존성 설치

```bash
cd shopping-mall
npm install
# 또는
yarn install
```

### 2. Hasura 및 PostgreSQL 실행

Docker Compose를 사용하여 Hasura와 PostgreSQL을 실행합니다:

```bash
docker-compose up -d
```

- PostgreSQL: localhost:5432
- Hasura Console: http://localhost:8080

### 3. Hasura 설정

Hasura 콘솔(http://localhost:8080)에서:

1. Admin Secret: `myadminsecretkey`
2. 테이블 추적(Track tables) 실행
3. 권한 설정 (anonymous role에 select 권한 부여)

### 4. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
```

http://localhost:3000에서 앱을 확인할 수 있습니다.

## 프로젝트 구조

```
shopping-mall/
├── app/                    # Next.js App Router 페이지
│   ├── cart/              # 장바구니 페이지
│   ├── categories/        # 카테고리 목록 페이지
│   ├── category/[slug]/   # 카테고리 상품 페이지
│   ├── product/[id]/      # 상품 상세 페이지
│   ├── profile/           # 프로필 페이지
│   ├── search/            # 검색 페이지
│   └── wishlist/          # 위시리스트 페이지
├── src/
│   ├── app/               # 앱 프로바이더 및 스타일
│   ├── entities/          # 엔티티 (Product, Category, Cart)
│   ├── features/          # 기능 모듈
│   ├── shared/            # 공유 컴포넌트, API, 타입
│   └── widgets/           # 위젯 (Header, BottomNav)
├── hasura/                # Hasura 마이그레이션 및 메타데이터
├── docker-compose.yml     # Docker Compose 설정
└── package.json
```

## 주요 기능

- 상품 목록 및 상세 보기
- 카테고리별 상품 필터링
- 상품 검색
- 장바구니 (로컬 스토리지 저장)
- 모바일 최적화된 UI

## 환경 변수

`.env.local` 파일에서 설정:

```env
NEXT_PUBLIC_HASURA_ENDPOINT=http://localhost:8080/v1/graphql
HASURA_GRAPHQL_ADMIN_SECRET=myadminsecretkey
```

## Hasura 테이블 권한 설정

Hasura 콘솔에서 각 테이블에 대해 anonymous role의 권한을 설정해야 합니다:

1. `categories` - select 권한
2. `products` - select 권한
3. `cart_items` - select, insert, update, delete 권한
4. `users` - select 권한

## 스크립트

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 실행
npm run hasura:up    # Docker Compose 실행
npm run hasura:down  # Docker Compose 중지
```
