// 레퍼런스: dynamic-import--suspense--lazy-loading.md, error-boundary--component.md
// C-07: SRP — 인증 상태에 따른 라우팅 분기 + 게스트 초대 경로
// P-04: 삼항 연산자 조건부 렌더
// P-07: 요청 워터폴 제거 — TanStack Query가 훅 병렬 실행으로 자동 해결
// P-08: 무거운 컴포넌트 dynamic import
// S-04: TanStack Query 사용 (수동 fetch 패턴 미사용)
// T-05: Suspense 올바른 사용 (lazy와 함께)
// A-07: barrel file public API만 사용

import { lazy, Suspense, useCallback, useState } from 'react';
import { AppProviders } from './providers/AppProviders';
import { LoginPage, useAuthStore, useRecentUsers, useAppConfig } from '@/features/auth';
import { GuestJoinPage, useInviteInfo, useJoinAsGuest } from '@/features/invite';

// ✅ P-08: ChatPage를 lazy로 분리 — 로그인 전에는 번들에 포함되지 않음
// ✅ T-05: Suspense + lazy() 조합 — 올바른 사용 (일반 fetch에 Suspense 사용 금지)
// FSD: pages 레이어에서 ChatPage import
const ChatPage = lazy(() => import('@/pages/chat').then((m) => ({ default: m.ChatPage })));

// ✅ P-03: 모듈 레벨 상수
const EMPTY_RECENT_USERS: never[] = [];
const INVITE_PATH_PREFIX = '/invite/';

function getInviteCode(): string | null {
  const path = window.location.pathname;
  if (path.startsWith(INVITE_PATH_PREFIX)) {
    return path.slice(INVITE_PATH_PREFIX.length);
  }
  return null;
}

function GuestJoinRoute({ inviteCode }: { inviteCode: string }) {
  const { data, isLoading, isError, error } = useInviteInfo(inviteCode);
  const joinAsGuest = useJoinAsGuest(inviteCode);
  const signInAsGuest = useAuthStore((s) => s.signInAsGuest);

  // ✅ N-03: handle 접두사
  const handleJoin = useCallback((nickname: string) => {
    joinAsGuest.mutate(
      { inviteCode, nickname },
      {
        // ✅ S-17: onSuccess는 사용처에서 정의
        onSuccess: (response) => {
          signInAsGuest(
            {
              id: response.user.id,
              username: response.user.nickname,
              displayName: `${response.user.nickname} (게스트)`,
              avatarUrl: response.user.avatarUrl,
            },
            response.token,
            response.channelId,
          );
          window.history.replaceState(null, '', '/');
        },
      },
    );
  }, [joinAsGuest, signInAsGuest, inviteCode]);

  return (
    <GuestJoinPage
      channelName={data?.channelName ?? ''}
      isLoading={isLoading}
      isJoining={joinAsGuest.isPending}
      isError={isError}
      errorMessage={error?.message ?? '유효하지 않은 초대 링크입니다.'}
      onJoin={handleJoin}
    />
  );
}

function AppContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [inviteCode] = useState(getInviteCode);

  // ✅ S-04: TanStack Query 사용 (수동 fetch 패턴 미사용)
  // ✅ P-07: 두 쿼리가 동시에 실행됨 → 워터폴 없음
  const { data: recentUsers = EMPTY_RECENT_USERS } = useRecentUsers();
  useAppConfig(); // 앱 설정 프리페치 (향후 사용 대비)

  // ✅ N-03: handle 접두사
  const handleLoginSuccess = useCallback(() => {
    // 인증 상태는 이미 store에서 업데이트됨 → 리렌더로 ChatPage 표시
  }, []);

  // 게스트 초대 경로 처리
  if (inviteCode && !isAuthenticated) {
    return <GuestJoinRoute inviteCode={inviteCode} />;
  }

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
