// 레퍼런스: msw--mock--integration-test.md, testing-library--unit-test--mock.md
// T-01: 구현 세부사항 테스트 없음 (내부 state, className 등)
// T-02: MSW 네트워크 레벨 모킹
// T-03: 소스 옆 테스트 배치
// T-07: 테스트 피라미드 — integration test
// T-08: 사용자 관점 쿼리 (getByRole, getByLabelText)

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockServer } from '@/shared/testing/setupMsw';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '../hooks/useAuthStore';
import { NotificationProvider } from '@/shared/contexts/NotificationContext';
import type { RecentUser } from '../types';

// ✅ T-02: MSW 네트워크 레벨 모킹 (fetch/axios 직접 모킹 금지)
const server = createMockServer(
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
    if (body.username === 'jimin' && body.password === 'password') {
      return HttpResponse.json({
        user: {
          id: 'user-1',
          username: 'jimin',
          displayName: '박지민',
          avatarUrl: 'https://example.com/avatar.png',
        },
        token: 'mock-token-user-1',
      });
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),
);

// ✅ P-03: 모듈 레벨 상수
const MOCK_RECENT_USERS: RecentUser[] = [
  { id: 'r-1', username: 'jimin', displayName: '박지민', avatarUrl: 'https://example.com/1.png' },
  { id: 'r-2', username: 'soyeon', displayName: '김소연', avatarUrl: 'https://example.com/2.png' },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderLoginPage(props?: Partial<{ onLoginSuccess: () => void; recentUsers: RecentUser[] }>) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <LoginPage
          recentUsers={props?.recentUsers ?? MOCK_RECENT_USERS}
          onLoginSuccess={props?.onLoginSuccess ?? vi.fn()}
        />
      </NotificationProvider>
    </QueryClientProvider>,
  );
}

// ✅ 테스트 간 Zustand store 초기화
beforeEach(() => {
  useAuthStore.setState({ currentUser: null, token: null, isAuthenticated: false });
});

describe('LoginPage', () => {
  // ✅ T-08: 사용자 관점 쿼리
  test('renders login form with all fields', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: 'Chat App' })).toBeInTheDocument();
    expect(screen.getByLabelText('사용자명')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  test('shows validation error when fields are empty', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: '로그인' }));

    // ✅ T-01: 사용자가 보는 에러 메시지를 검증
    expect(screen.getByRole('alert')).toHaveTextContent(
      '사용자명과 비밀번호를 입력해주세요.',
    );
  });

  test('successfully logs in with valid credentials', async () => {
    const user = userEvent.setup();
    const handleLoginSuccess = vi.fn();
    renderLoginPage({ onLoginSuccess: handleLoginSuccess });

    await user.type(screen.getByLabelText('사용자명'), 'jimin');
    await user.type(screen.getByLabelText('비밀번호'), 'password');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(handleLoginSuccess).toHaveBeenCalledOnce();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.currentUser?.username).toBe('jimin');
  });

  test('shows error message with invalid credentials', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('사용자명'), 'jimin');
    await user.type(screen.getByLabelText('비밀번호'), 'wrong');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByText('사용자명 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument();
    });
  });

  // ✅ C-12: key 리셋 테스트 — 모드 전환 시 폼 초기화
  test('resets form when switching between login and register mode', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // 로그인 모드에서 입력
    await user.type(screen.getByLabelText('사용자명'), 'test');

    // 회원가입 모드로 전환
    await user.click(screen.getByRole('button', { name: /회원가입/ }));

    // ✅ key 리셋 확인 — 입력값이 초기화됨
    expect(screen.getByLabelText('사용자명')).toHaveValue('');
    // 회원가입 모드에서 표시 이름 필드 존재
    expect(screen.getByLabelText('표시 이름')).toBeInTheDocument();
  });

  // S-12: 비밀번호 보기/숨기기 토글
  test('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const passwordInput = screen.getByLabelText('비밀번호');
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: '비밀번호 보기' }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: '비밀번호 숨기기' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // P-02: 가상화 리스트 — 사용자 목록 UI 렌더링
  // Note: jsdom에서 scroll container 크기가 0이라 virtualizer 아이템은 렌더되지 않음
  // → 검색 UI 존재 여부와 리스트 컨테이너 확인으로 대체
  test('renders recent user search interface', () => {
    renderLoginPage();

    // 사용자 검색 필드 존재
    expect(screen.getByLabelText('사용자 검색')).toBeInTheDocument();
    // 가상화 리스트 컨테이너 존재
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
