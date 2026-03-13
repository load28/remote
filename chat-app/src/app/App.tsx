// 레퍼런스: dynamic-import--suspense--lazy-loading.md, error-boundary--component.md
// C-07: SRP — 인증 상태에 따른 라우팅 분기
// P-04: 삼항 연산자 조건부 렌더
// P-07: 요청 워터폴 제거 — TanStack Query가 훅 병렬 실행으로 자동 해결
// P-08: 무거운 컴포넌트 dynamic import
// S-04: TanStack Query 사용 (수동 fetch 패턴 미사용)
// T-05: Suspense 올바른 사용 (lazy와 함께)
// A-07: barrel file public API만 사용

import { lazy, Suspense, useCallback } from 'react';
import { AppProviders } from './providers/AppProviders';
import { LoginPage, useAuthStore, useRecentUsers, useAppConfig } from '@/features/auth';

// ✅ P-08: ChatPage를 lazy로 분리 — 로그인 전에는 번들에 포함되지 않음
// ✅ T-05: Suspense + lazy() 조합 — 올바른 사용 (일반 fetch에 Suspense 사용 금지)
const ChatPage = lazy(() => import('./ChatPage').then((m) => ({ default: m.ChatPage })));

// ✅ P-03: 모듈 레벨 상수
const EMPTY_RECENT_USERS: never[] = [];

function AppContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // ✅ S-04: TanStack Query 사용 (수동 fetch 패턴 미사용)
  // ✅ P-07: 두 쿼리가 동시에 실행됨 → 워터폴 없음
  const { data: recentUsers = EMPTY_RECENT_USERS } = useRecentUsers();
  useAppConfig(); // 앱 설정 프리페치 (향후 사용 대비)

  // ✅ N-03: handle 접두사
  const handleLoginSuccess = useCallback(() => {
    // 인증 상태는 이미 store에서 업데이트됨 → 리렌더로 ChatPage 표시
  }, []);

  // ✅ P-04: 삼항 연산자 조건부 렌더
  return isAuthenticated ? (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-white">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      }
    >
      <ChatPage />
    </Suspense>
  ) : (
    <LoginPage recentUsers={recentUsers} onLoginSuccess={handleLoginSuccess} />
  );
}

export function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
