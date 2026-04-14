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
import { PostsWithMemoryToken } from "@/components/posts-with-memory-token";
import { MemoryTokenSetter } from "@/components/memory-token-setter";
import { ClientOnly } from "@/components/client-only";
import { CookieSetter } from "@/components/cookie-setter";
import { PostsUseQuery } from "@/components/posts-use-query";

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

      {/* ===== 비교: useQuery로 동일하게 localStorage 접근 ===== */}
      <section
        style={{
          marginTop: "48px",
          padding: "24px",
          border: "2px solid #3b82f6",
          borderRadius: "12px",
          backgroundColor: "#eff6ff",
        }}
      >
        <h2 style={{ color: "#2563eb" }}>
          useQuery + localStorage (동일 조건)
        </h2>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          useSuspenseQuery와 동일하게 queryFn에서 localStorage 접근.
          SSR 시 어떻게 되는가?
        </p>
        <PostsUseQuery />
      </section>

      {/* ===== BUG 1: useSuspenseQuery로 localStorage 직접 접근 ===== */}
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
          BUG 1: useSuspenseQuery + localStorage (동일 조건)
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

      {/* ===== 메모리 토큰: ClientOnly로 SSR 자체를 건너뜀 ===== */}
      <section
        style={{
          marginTop: "32px",
          padding: "24px",
          border: "2px solid #8b5cf6",
          borderRadius: "12px",
          backgroundColor: "#f5f3ff",
        }}
      >
        <h2 style={{ color: "#7c3aed" }}>
          메모리 토큰: ClientOnly로 SSR 건너뛰기
        </h2>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          토큰이 메모리(JS 변수)에 있으면 SSR을 피하면 됨.
          <br />
          ClientOnly 래퍼로 서버에서 렌더링하지 않으면 queryFn이 서버에서 실행되지 않음.
          <br />
          대신 SSR의 이점(서버 렌더링, SEO 등)을 포기하게 됨.
        </p>
        <MemoryTokenSetter />
        <ClientOnly
          fallback={<LoadingSkeleton label="게시글 (클라이언트 대기 중)" />}
        >
          <Suspense fallback={<LoadingSkeleton label="게시글 (메모리 토큰)" />}>
            <PostsWithMemoryToken />
          </Suspense>
        </ClientOnly>
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
