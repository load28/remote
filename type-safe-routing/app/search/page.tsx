import { Suspense } from "react";
import Link from "next/link";
import { searchParamsCache, SearchSerializer } from "@/shared/routing";
import { SearchForm } from "./SearchForm";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = searchParamsCache.parse(await searchParams);

  // 예제 URL 생성
  const exampleUrls = [
    {
      label: "상품만 검색",
      url: SearchSerializer.serialize({
        query: "테스트",
        type: "products",
      }).toUrl("/search"),
    },
    {
      label: "날짜 필터",
      url: SearchSerializer.serialize({
        query: "회의록",
        from: new Date("2024-01-01"),
        to: new Date("2024-12-31"),
      }).toUrl("/search"),
    },
    {
      label: "고급 필터 (JSON)",
      url: SearchSerializer.serialize({
        query: "리뷰",
        filters: {
          verified: true,
          minRating: 4,
          tags: ["추천", "베스트"],
        },
      }).toUrl("/search"),
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
        <h1>일반 검색 페이지</h1>

        <div className="card mb-2">
          <h2>현재 쿼리 파라미터 (서버에서 파싱)</h2>
          <div className="code">
            <pre>
              {JSON.stringify(
                {
                  ...params,
                  from: params.from?.toISOString() ?? null,
                  to: params.to?.toISOString() ?? null,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>

        <div className="card mb-2">
          <h2>예제 URL 링크</h2>
          <div className="flex flex-gap" style={{ flexWrap: "wrap" }}>
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
            <SearchForm />
          </Suspense>
        </div>

        <div className="card">
          <h2>날짜 파서 & JSON 파서 예제</h2>
          <div className="code">
            <pre>{`// 커스텀 날짜 파서
export const parseAsDate = {
  parse: (value: string) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  },
  serialize: (value: Date) => value.toISOString().split("T")[0],
};

// JSON 객체 파서
export function parseAsJson<T>() {
  return {
    parse: (value: string) => {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    },
    serialize: (value: T) => JSON.stringify(value),
  };
}

// 사용 예
const searchParams = {
  from: parseAsDate,
  filters: parseAsJson<{
    verified?: boolean;
    minRating?: number;
    tags?: string[];
  }>(),
};`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
