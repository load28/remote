// 레퍼런스: compound-component--context--generic.md
// C-09: Compound Component 패턴 — AuthForm.Field, AuthForm.SubmitButton
// C-03: 배열 인덱스 key 미사용 → field id를 key로 사용

import { createContext, useContext, useMemo } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';

// ✅ Compound Component 내부 Context
interface AuthFormContextValue {
  isSubmitting: boolean; // N-04: Boolean is 접두사
}

const AuthFormContext = createContext<AuthFormContextValue | null>(null);

function useAuthFormContext(): AuthFormContextValue {
  const ctx = useContext(AuthFormContext);
  if (!ctx) throw new Error('AuthForm compounds must be within <AuthForm>');
  return ctx;
}

// --- Root ---
// ✅ T-13: named exported interface
export interface AuthFormProps extends PropsWithChildren {
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function AuthForm({ isSubmitting, onSubmit, children }: AuthFormProps) {
  // ✅ S-14: context value useMemo
  const value = useMemo(() => ({ isSubmitting }), [isSubmitting]);

  return (
    <AuthFormContext.Provider value={value}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {children}
      </form>
    </AuthFormContext.Provider>
  );
}

// --- Field ---
export interface AuthFormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  autoComplete?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: ReactNode; // 커스텀 input 대체용 (예: PasswordField)
}

function Field({
  id,
  label,
  type = 'text',
  value,
  placeholder,
  autoComplete,
  onChange,
  children,
}: AuthFormFieldProps) {
  const { isSubmitting } = useAuthFormContext();

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {/* ✅ P-04: 삼항 연산자 조건부 렌더 */}
      {children ? (
        children
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      )}
    </div>
  );
}

// --- SubmitButton ---
export interface AuthFormSubmitButtonProps {
  label: string;
  loadingLabel: string;
}

function SubmitButton({ label, loadingLabel }: AuthFormSubmitButtonProps) {
  const { isSubmitting } = useAuthFormContext();

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isSubmitting ? loadingLabel : label}
    </button>
  );
}

// --- Error ---
export interface AuthFormErrorProps {
  message: string;
}

function FormError({ message }: AuthFormErrorProps) {
  return message !== '' ? (
    <p className="text-sm text-red-600" role="alert">
      {message}
    </p>
  ) : null;
}

// ✅ C-09: Compound Component 합성 패턴 노출
AuthForm.Field = Field;
AuthForm.SubmitButton = SubmitButton;
AuthForm.Error = FormError;
