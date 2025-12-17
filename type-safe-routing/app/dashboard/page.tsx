import { Suspense } from "react";
import Link from "next/link";
import { dashboardParamsCache, DashboardSerializer } from "@/shared/routing";
import { DashboardControls } from "./DashboardControls";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = dashboardParamsCache.parse(await searchParams);

  // 예제 URL 생성
  const exampleUrls = [
    {
      label: "테이블 보기",
      url: DashboardSerializer.serialize({
        view: "table",
        timeRange: "week",
      }).toUrl("/dashboard"),
    },
    {
      label: "분기별 비교",
      url: DashboardSerializer.serialize({
        view: "grid",
        timeRange: "quarter",
        compare: true,
        metrics: ["revenue", "users", "orders"],
      }).toUrl("/dashboard"),
    },
    {
      label: "상세 패널 열기",
      url: DashboardSerializer.serialize({
        detailId: "metric-123",
        view: "list",
      }).toUrl("/dashboard"),
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
        <h1>대시보드 페이지</h1>

        <div className="card mb-2">
          <h2>현재 쿼리 파라미터 (서버에서 파싱)</h2>
          <div className="code">
            <pre>{JSON.stringify(params, null, 2)}</pre>
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
          <h2>대시보드 컨트롤 (클라이언트 컴포넌트)</h2>
          <Suspense fallback={<div>Loading controls...</div>}>
            <DashboardControls />
          </Suspense>
        </div>

        {params.detailId && (
          <div className="card mb-2" style={{ borderLeft: "4px solid #0070f3" }}>
            <h3>상세 패널</h3>
            <p>선택된 상세 ID: <strong>{params.detailId}</strong></p>
            <p>URL에 detailId 파라미터가 있으면 이 패널이 표시됩니다.</p>
          </div>
        )}

        <div className="card">
          <h2>대시보드 파라미터 정의</h2>
          <div className="code">
            <pre>{`export const dashboardParams = {
  // 보기 모드: 'grid' | 'list' | 'table'
  view: parseAsStringLiteral(dashboardViewOptions)
    .withDefault("grid"),

  // 시간 범위: 'today' | 'week' | 'month' | 'quarter' | 'year'
  timeRange: parseAsStringLiteral(timeRangeOptions)
    .withDefault("month"),

  // 선택된 메트릭들 (배열)
  metrics: parseAsArrayOf(parseAsString)
    .withDefault(["revenue", "users"]),

  // 비교 모드 활성화
  compare: parseAsBoolean.withDefault(false),

  // 상세 패널 열기 (nullable)
  detailId: parseAsString,
};`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
