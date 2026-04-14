import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { UserList } from "@/components/user-list";
import { TodoList } from "@/components/todo-list";
import { ProtectedPostsBroken } from "@/components/protected-posts-broken";
import { ProtectedPostsFixed } from "@/components/protected-posts-fixed";
import { TokenSetter } from "@/components/token-setter";

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

export default function Page() {
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

      {/* ===== 토큰 문제 재현 ===== */}
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
          BUG: queryFn에서 직접 localStorage 접근
        </h2>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          SSR 시 localStorage가 없어서 에러 발생. ErrorBoundary가 잡아줌.
        </p>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSkeleton label="게시글" />}>
            <ProtectedPostsBroken />
          </Suspense>
        </ErrorBoundary>
      </section>

      {/* ===== 토큰 문제 해결 ===== */}
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
          FIX: useToken + skipToken 패턴
        </h2>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          SSR 시 토큰이 null → skipToken으로 쿼리 스킵. 하이드레이션 후 토큰 있으면 실행.
        </p>
        <TokenSetter />
        <Suspense fallback={<LoadingSkeleton label="게시글" />}>
          <ProtectedPostsFixed />
        </Suspense>
      </section>
    </main>
  );
}
