import { Suspense } from "react";
import { cookies } from "next/headers";
import { ErrorBoundary } from "@/components/error-boundary";
import { UserList } from "@/components/user-list";
import { TodoList } from "@/components/todo-list";
import { ProtectedPostsBroken } from "@/components/protected-posts-broken";
import { ProtectedPostsFixed } from "@/components/protected-posts-fixed";
import { PostsWithServerAction } from "@/components/posts-with-server-action";
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
  // 서버 컴포넌트에서 쿠키로 토큰을 읽음
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? null;

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

      {/* ===== FIX: 서버 컴포넌트에서 토큰 읽어서 props로 전달 ===== */}
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
          FIX: 서버 컴포넌트에서 cookies() → props 전달
        </h2>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          서버 컴포넌트(page.tsx)에서 쿠키를 읽고, 클라이언트 컴포넌트에 props로 전달.
          queryFn은 순수한 fetch만 수행.
        </p>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          현재 토큰: <code>{token ?? "(없음)"}</code>
        </p>
        <CookieSetter />
        <Suspense fallback={<LoadingSkeleton label="게시글 (props 토큰)" />}>
          <ProtectedPostsFixed token={token} />
        </Suspense>
      </section>
    </main>
  );
}
