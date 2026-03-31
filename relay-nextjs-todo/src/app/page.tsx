/**
 * =============================================================================
 * 메인 페이지 (Server Component → Client Component 위임)
 * =============================================================================
 *
 * Next.js App Router에서 page.tsx는 기본적으로 Server Component입니다.
 * Relay는 클라이언트에서 동작하므로, 실제 데이터 페칭은 Client Component에 위임합니다.
 *
 * 참고: Relay는 서버 컴포넌트 지원을 실험 중이지만,
 * 현재 안정적인 방식은 클라이언트 컴포넌트에서 사용하는 것입니다.
 * =============================================================================
 */

import { TodoApp } from '@/components/TodoApp';

// 클라이언트에서만 데이터를 fetch하므로 빌드 시 정적 생성을 비활성화
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="app">
      <h1 className="app-title">Relay Todos</h1>
      <TodoApp />
    </main>
  );
}
