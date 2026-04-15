import { Suspense } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { verifySession } from "@/lib/dal";
import { postsQueryOptions } from "@/lib/queries";
import { PostList } from "./post-list";

const API_BASE = process.env.API_BASE_URL ?? "https://jsonplaceholder.typicode.com";

/**
 * Dashboard Page (서버 컴포넌트)
 *
 * 1. verifySession() → 토큰 없으면 /login 리다이렉트
 * 2. prefetchQuery() → 서버에서 토큰으로 직접 fetch (프록시 안 거침)
 * 3. HydrationBoundary → 데이터만 클라이언트에 전달 (토큰 노출 없음)
 */
export default async function DashboardPage() {
  const session = await verifySession();
  console.log("[DashboardPage] 인증 완료, userId:", session.userId);

  const queryClient = new QueryClient();

  // 서버용 prefetch: 토큰 직접 사용, 외부 API 직접 호출
  await queryClient.prefetchQuery({
    queryKey: postsQueryOptions.queryKey,
    queryFn: async () => {
      console.log("[Server prefetch] 외부 API 직접 호출, 토큰:", session.token ? "***존재***" : "(없음)");

      const res = await fetch(`${API_BASE}/posts?_limit=5`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      console.log("[Server prefetch] 완료, posts:", data.length, "개");
      return data;
    },
  });

  return (
    <div>
      <h1>Dashboard</h1>
      <p style={{ color: "#64748b" }}>
        서버 prefetch + useSuspenseQuery
      </p>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<div style={{ color: "#94a3b8" }}>로딩 중...</div>}>
          <PostList />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
