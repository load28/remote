import { Suspense } from "react";
import { cookies } from "next/headers";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { PostList } from "./post-list";

/**
 * 엔터프라이즈 패턴: 서버 컴포넌트에서 prefetch
 *
 * 토큰 흐름:
 * 1. 서버 컴포넌트에서 cookies()로 토큰 읽기 (서버 전용)
 * 2. prefetchQuery에서 외부 API 직접 호출 (토큰 포함)
 * 3. HydrationBoundary로 데이터만 클라이언트에 전달 (토큰 노출 없음)
 * 4. useSuspenseQuery는 캐시에 데이터가 있으므로 queryFn 실행 안 함
 * 5. 클라이언트 refetch 시 → /api/posts Route Handler가 쿠키로 토큰 처리
 *
 * 결과: 토큰은 서버를 절대 벗어나지 않음
 */
export default async function EnterprisePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const queryClient = new QueryClient();

  // 서버에서 직접 외부 API 호출 (토큰은 여기서만 사용)
  await queryClient.prefetchQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const res = await fetch(
        "https://jsonplaceholder.typicode.com/posts?_limit=5",
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  return (
    <main style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 16px" }}>
      <h1>Enterprise Pattern</h1>
      <p style={{ color: "#64748b" }}>
        Server prefetch + HydrationBoundary + Route Handler BFF
      </p>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={
            <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
              로딩 중...
            </div>
          }
        >
          <PostList />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
