import { Suspense } from "react";
import { UserList } from "@/components/user-list";
import { TodoList } from "@/components/todo-list";

// 이 컴포넌트는 서버 컴포넌트 (기본값)
// 서스펜스 바운더리 안에서 useSuspenseQuery를 사용하는 클라이언트 컴포넌트를 렌더링

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
      ⏳ {label} 로딩 중...
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

      <section style={{ marginTop: "32px" }}>
        <h2>👤 Users (2초 지연)</h2>
        <Suspense fallback={<LoadingSkeleton label="사용자 목록" />}>
          <UserList />
        </Suspense>
      </section>

      <section style={{ marginTop: "32px" }}>
        <h2>📋 Todos (3초 지연)</h2>
        <Suspense fallback={<LoadingSkeleton label="할 일 목록" />}>
          <TodoList />
        </Suspense>
      </section>
    </main>
  );
}
