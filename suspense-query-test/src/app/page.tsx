import { Suspense } from "react";
import { cookies } from "next/headers";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { UserList } from "@/components/user-list";
import { TodoList } from "@/components/todo-list";
import { ProtectedPostsBroken } from "@/components/protected-posts-broken";
import { PostsWithServerAction } from "@/components/posts-with-server-action";
import { PostsHydrated } from "@/components/posts-hydrated";
import { CookieSetter } from "@/components/cookie-setter";

// 이 컴포넌트는 서버 컴포넌트 (기본값)

function LoadingSkeleton({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "24px",
        border: "1px dashed #94a3b8",
        borderRadius: "8px",
        textAlign: "center",
        color: "#94a3b8",
      }}
    >
      {label} 로딩 중...
    </div>
  );
}

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // 서버 컴포넌트에서 prefetch: 토큰은 여기서만 사용되고 클라이언트에 전달되지 않음
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      console.log("[Server Prefetch] token:", token ?? "(없음)");
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
      <h1>Suspense Query Test</h1>
      <p style={{ color: "#64748b" }}>
        서버 컴포넌트 → Suspense → useSuspenseQuery (클라이언트 컴포넌트)
      </p>

      {/* ===== 기본 테스트 ===== */}
      <section style={{ marginTop: "32px" }}>
        <h2>Users (2초 지연)</h2>
        <Suspense fallback={<LoadingSkeleton label="사용자 목록" />}>
          <UserList />
        </Suspense>
      </section>

      <section style={{ marginTop: "32px" }}>
        <h2>Todos (3초 지연)</h2>
        <Suspense fallback={<LoadingSkeleton label="할 일 목록" />}>
          <TodoList />
        </Suspense>
      </section>

      {/* ===== BUG 1: queryFn에서 localStorage 직접 접근 ===== */}
      <section
        style={{
          marginTop: "48px",
          padding: "24px",
          border: "2px solid #ef4444",
          borderRadius: "12px",
          backgroundColor: "#fef2f2",
        }}
      >
        <h2 style={{ color: "#dc2626" }}>
          BUG 1: queryFn에서 직접 localStorage 접근
        </h2>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          SSR 시 localStorage가 없어서 에러 →{" "}
          <code>ReferenceError: localStorage is not defined</code>
        </p>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSkeleton label="게시글" />}>
            <ProtectedPostsBroken />
          </Suspense>
        </ErrorBoundary>
      </section>

      {/* ===== BUG 2: queryFn에서 서버 액션 호출 ===== */}
      <section
        style={{
          marginTop: "32px",
          padding: "24px",
          border: "2px solid #ef4444",
          borderRadius: "12px",
          backgroundColor: "#fef2f2",
        }}
      >
        <h2 style={{ color: "#dc2626" }}>
          BUG 2: queryFn에서 서버 액션으로 쿠키 토큰 가져오기
        </h2>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          SSR 시 서버 액션 호출 차단 →{" "}
          <code>Server Functions cannot be called during initial render</code>
        </p>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSkeleton label="게시글 (서버 액션)" />}>
            <PostsWithServerAction />
          </Suspense>
        </ErrorBoundary>
      </section>

      {/* ===== FIX: prefetch + HydrationBoundary + Route Handler ===== */}
      <section
        style={{
          marginTop: "32px",
          padding: "24px",
          border: "2px solid #22c55e",
          borderRadius: "12px",
          backgroundColor: "#f0fdf4",
        }}
      >
        <h2 style={{ color: "#16a34a" }}>
          FIX: Server Prefetch + HydrationBoundary + Route Handler
        </h2>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          1. 서버 컴포넌트에서 cookies()로 토큰 읽고 prefetchQuery로 데이터를 미리 fetch
          <br />
          2. HydrationBoundary로 캐시를 클라이언트에 전달 (토큰은 전달 안 됨, 데이터만 전달)
          <br />
          3. 클라이언트 refetch 시 /api/posts Route Handler가 쿠키에서 토큰을 읽어 프록시
        </p>
        <CookieSetter />
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<LoadingSkeleton label="게시글 (hydrated)" />}>
            <PostsHydrated />
          </Suspense>
        </HydrationBoundary>
      </section>
    </main>
  );
}
