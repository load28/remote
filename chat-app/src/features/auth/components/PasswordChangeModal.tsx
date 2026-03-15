// 레퍼런스: modal--portal--focus-management--a11y.md, custom-emoji--form--mutation--zustand.md
// C-07: SRP — 비밀번호 변경 폼 모달만 담당
// S-13: controlled, T-11: 시맨틱 HTML, N-03: on/handle

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/Modal';
import { PasswordField } from './PasswordField';
import { usePasswordStrength } from '../hooks/usePasswordStrength';
import type { ChangePasswordInput } from '../types';

// ✅ T-13: named exported interface
export interface PasswordChangeModalProps {
  isOpen: boolean;           // N-04
  isSubmitting: boolean;     // N-04
  onClose: () => void;       // N-03
  onSubmitPassword: (input: ChangePasswordInput) => void; // N-03
}

// ✅ P-03: 모듈 레벨 상수
const EMPTY_STRING = '';

// ✅ C-10: 파일당 1 exported 컴포넌트
export function PasswordChangeModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmitPassword,
}: PasswordChangeModalProps) {
  // ✅ S-09: 로컬 UI 상태
  const [currentPassword, setCurrentPassword] = useState(EMPTY_STRING);
  const [newPassword, setNewPassword] = useState(EMPTY_STRING);
  const [confirmPassword, setConfirmPassword] = useState(EMPTY_STRING);
  const { strength, updateStrength } = usePasswordStrength();

  // 모달 열릴 때 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword(EMPTY_STRING);
      setNewPassword(EMPTY_STRING);
      setConfirmPassword(EMPTY_STRING);
      updateStrength(EMPTY_STRING);
    }
    // S-16 예외: 동기적 일회성 setState — 구독/리스너/타이머 없음
  }, [isOpen, updateStrength]);

  // ✅ N-04: has/is 접두사
  const hasPasswordMismatch = newPassword !== confirmPassword;
  const hasValidInput =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    confirmPassword.length > 0 &&
    !hasPasswordMismatch;

  // ✅ N-03: handle 접두사
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    updateStrength(value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasValidInput) return;
    onSubmitPassword({
      currentPassword,
      newPassword,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="비밀번호 변경">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="current-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            현재 비밀번호
          </label>
          <PasswordField
            id="current-password"
            value={currentPassword}
            strength={{ level: 'empty', score: 0 }}
            isDisabled={isSubmitting}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            새 비밀번호
          </label>
          <PasswordField
            id="new-password"
            value={newPassword}
            strength={strength}
            isDisabled={isSubmitting}
            onChange={handleNewPasswordChange}
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            새 비밀번호 확인
          </label>
          <PasswordField
            id="confirm-password"
            value={confirmPassword}
            strength={{ level: 'empty', score: 0 }}
            isDisabled={isSubmitting}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {/* ✅ P-04: 삼항 조건부 렌더링 */}
          {hasPasswordMismatch && confirmPassword.length > 0 ? (
            <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다</p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!hasValidInput || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '변경 중...' : '비밀번호 변경'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
