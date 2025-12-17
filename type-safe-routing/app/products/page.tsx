import { Suspense } from "react";
import Link from "next/link";
import { productSearchParamsCache, ProductSearchSerializer } from "@/shared/routing";
import { ProductSearchForm } from "./ProductSearchForm";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = productSearchParamsCache.parse(await searchParams);

  // 예제 URL 생성
  const exampleUrls = [
    {
      label: '전자제품 검색',
      url: ProductSearchSerializer.serialize({
        q: '노트북',
        categories: ['electronics'],
        sort: 'price_asc',
        page: 1,
      }).toUrl('/products'),
    },
    {
      label: '가격 범위 필터',
      url: ProductSearchSerializer.serialize({
        priceRange: { min: 100000, max: 500000 },
        inStock: true,
        sort: 'newest',
      }).toUrl('/products'),
    },
    {
      label: '다중 카테고리',
      url: ProductSearchSerializer.serialize({
        categories: ['electronics', 'clothing', 'books'],
        page: 2,
        limit: 10,
      }).toUrl('/products'),
    },
  ];

  return (
    <div>
      <nav className="nav">
        <ul>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/products">Products</Link></li>
          <li><Link href="/search">Search</Link></li>
          <li><Link href="/dashboard">Dashboard</Link></li>
        </ul>
      </nav>

      <div className="container">
        <h1>상품 검색 페이지</h1>

        <div className="card mb-2">
          <h2>현재 쿼리 파라미터 (서버에서 파싱)</h2>
          <div className="code">
            <pre>{JSON.stringify(params, null, 2)}</pre>
          </div>
        </div>

        <div className="card mb-2">
          <h2>예제 URL 링크</h2>
          <div className="flex flex-gap" style={{ flexWrap: 'wrap' }}>
            {exampleUrls.map(({ label, url }) => (
              <Link key={label} href={url} className="btn btn-secondary">
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="card mb-2">
          <h2>검색 폼 (클라이언트 컴포넌트)</h2>
          <Suspense fallback={<div>Loading form...</div>}>
            <ProductSearchForm />
          </Suspense>
        </div>

        <div className="card">
          <h2>serialize/deserialize 예제</h2>
          <div className="code">
            <pre>{`// 상태를 URL로 직렬화
const serialized = ProductSearchSerializer.serialize({
  q: '노트북',
  categories: ['electronics'],
  priceRange: { min: 100000, max: 500000 },
  sort: 'price_asc',
  page: 1,
});

console.log(serialized.queryString);
// ?q=노트북&categories=electronics&priceRange=100000-500000&sort=price_asc&page=1

console.log(serialized.toUrl('/products'));
// /products?q=노트북&categories=electronics&...

// URL에서 상태 복원
const deserialized = ProductSearchSerializer.deserializeFromUrl(
  '/products?q=test&page=2'
);

console.log(deserialized.state);
// { q: 'test', categories: [], priceRange: { min: 0, max: 1000000 }, ... }`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
