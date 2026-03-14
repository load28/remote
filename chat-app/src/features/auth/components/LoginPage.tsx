// C-07: SRP — 페이지 레벨 조합 컴포넌트
// C-12: key로 컴포넌트 상태 리셋 (폼 모드 전환 시)
// P-10: 정적 JSX 모듈 레벨 추출
// P-14: 객체/배열 의존성 useMemo
// T-06: ErrorBoundary 한계 인식 — 이벤트 핸들러 try-catch
// T-10: 라우트 레벨 에러 바운더리

import { useMemo, useState } from 'react';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { useNotificationActions } from '@/shared/contexts/NotificationContext';
import { AuthLayout } from './AuthLayout';
import { AuthForm } from './AuthForm';
import { PasswordField } from './PasswordField';
import { RecentUserList } from './RecentUserList';
import { useLoginMutation } from '../hooks/useLoginMutation';
import { useAuthStore } from '../hooks/useAuthStore';
import { usePasswordStrength } from '../hooks/usePasswordStrength';
import type { AuthFormMode, RecentUser } from '../types';

// ✅ P-03: 모듈 레벨 상수
const INITIAL_FORM = { username: '', password: '', displayName: '' };

// ✅ P-10: 정적 JSX 모듈 레벨 추출 — 리렌더마다 재생성 방지
const PAGE_HEADER = (
  <header className="text-center mb-6">
    <h1 className="text-2xl font-bold text-gray-900">Chat App</h1>
    <p className="text-sm text-gray-500 mt-1">로그인하여 대화를 시작하세요</p>
  </header>
);

const PAGE_FOOTER = (
  <footer className="mt-6 text-center">
    <p className="text-xs text-gray-400">
      테스트 계정: jimin / password
    </p>
  </footer>
);

// ✅ T-13: named exported interface
export interface LoginPageProps {
  recentUsers: RecentUser[];
  onLoginSuccess: () => void;
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function LoginPage({ recentUsers, onLoginSuccess }: LoginPageProps) {
  const [formMode, setFormMode] = useState<AuthFormMode>('login');
  const [form, setForm] = useState(INITIAL_FORM);
  const [errorMessage, setErrorMessage] = useState('');

  const loginMutation = useLoginMutation();
  const signIn = useAuthStore((s) => s.signIn);
  const { strength, updateStrength } = usePasswordStrength();
  const { addNotification } = useNotificationActions();

  // ✅ P-14: 객체 의존성 useMemo — formMode별 설정 안정화
  const formConfig = useMemo(
    () => ({
      submitLabel: formMode === 'login' ? '로그인' : '가입하기',
      loadingLabel: formMode === 'login' ? '로그인 중...' : '가입 중...',
      toggleLabel: formMode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인',
    }),
    [formMode],
  );

  // ✅ N-03: handle 접두사
  // ✅ C-12: 모드 전환 시 폼 상태 리셋 (key 리셋 + 명시적 state 초기화)
  const handleToggleMode = () => {
    setFormMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setForm(INITIAL_FORM);
    setErrorMessage('');
  };

  const handleChangeField = (field: keyof typeof INITIAL_FORM) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // ✅ S-06: 함수형 setState
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrorMessage('');

    if (field === 'password') {
      updateStrength(e.target.value);
    }
  };

  const handleSelectRecentUser = (username: string) => {
    setForm((prev) => ({ ...prev, username }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (form.username.trim() === '' || form.password.trim() === '') {
      setErrorMessage('사용자명과 비밀번호를 입력해주세요.');
      return;
    }

    // ✅ T-06: ErrorBoundary 한계 인식 — 이벤트 핸들러 에러는 ErrorBoundary가 못 잡음
    // → try-catch로 직접 처리
    // ✅ S-17: mutation 후속 로직(signIn)을 사용처에서 처리
    try {
      const { user, token } = await loginMutation.mutateAsync({
        username: form.username.trim(),
        password: form.password,
      });
      signIn(user, token);
      addNotification('success', '로그인 성공!');
      onLoginSuccess();
    } catch {
      setErrorMessage('사용자명 또는 비밀번호가 올바르지 않습니다.');
      addNotification('error', '로그인에 실패했습니다.');
    }
  };

  return (
    <AuthLayout>
      {PAGE_HEADER}

      {/* ✅ T-10: 라우트 레벨 에러 바운더리 (앱 > 라우트 > 위젯) */}
      <ErrorBoundary
        fallback={(error, reset) => (
          <div className="text-center py-8" role="alert">
            <p className="text-gray-600 mb-2">로그인 폼을 불러올 수 없습니다</p>
            <p className="text-sm text-gray-400 mb-4">{error.message}</p>
            <button
              type="button"
              onClick={reset}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              다시 시도
            </button>
          </div>
        )}
      >
        {/* ✅ C-09: Compound Component 사용 */}
        {/* ✅ C-12: key={formMode} → 모드 전환 시 폼 상태 완전 리셋 */}
        <AuthForm
          key={formMode}
          isSubmitting={loginMutation.isPending}
          onSubmit={handleSubmit}
        >
          {/* ✅ C-03: 필드별 고유 id를 key로 사용 (인덱스 아님) */}
          <AuthForm.Field
            id="username"
            label="사용자명"
            value={form.username}
            onChange={handleChangeField('username')}
            autoComplete="username"
            placeholder="사용자명을 입력하세요"
          />

          {/* ✅ S-12: PasswordField — 비밀번호 보기/숨기기 + 포커스 동기화 */}
          <AuthForm.Field
            id="password"
            label="비밀번호"
            type="password"
            value={form.password}
            onChange={handleChangeField('password')}
          >
            <PasswordField
              id="password"
              value={form.password}
              strength={strength}
              isDisabled={loginMutation.isPending}
              onChange={handleChangeField('password')}
            />
          </AuthForm.Field>

          {/* ✅ P-04: 삼항 연산자 조건부 렌더 */}
          {formMode === 'register' ? (
            <AuthForm.Field
              id="displayName"
              label="표시 이름"
              value={form.displayName}
              onChange={handleChangeField('displayName')}
              placeholder="표시 이름을 입력하세요"
            />
          ) : null}

          <AuthForm.Error message={errorMessage} />
          <AuthForm.SubmitButton
            label={formConfig.submitLabel}
            loadingLabel={formConfig.loadingLabel}
          />
        </AuthForm>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            {formConfig.toggleLabel}
          </button>
        </div>
      </ErrorBoundary>

      {/* ✅ T-10: 위젯 레벨 에러 바운더리 */}
      {recentUsers.length > 0 ? (
        <div className="mt-6">
          <ErrorBoundary fallback={<p className="text-xs text-red-400">사용자 목록을 불러올 수 없습니다</p>}>
            <RecentUserList
              users={recentUsers}
              onSelectUser={handleSelectRecentUser}
            />
          </ErrorBoundary>
        </div>
      ) : null}

      {PAGE_FOOTER}
    </AuthLayout>
  );
}
