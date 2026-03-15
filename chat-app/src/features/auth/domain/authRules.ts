// 레퍼런스: business-logic--pure-function--unit-test.md
// A-05: 비즈니스 로직이 컴포넌트 밖 순수 함수로 존재

import type { PasswordStrength, ChangePasswordInput } from '../types';

// ✅ 순수 함수 — 입력만으로 결과 결정, 부작용 없음
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) {
    return { level: 'empty', score: 0 };
  }

  let score = 0;

  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { level: 'weak', score };
  if (score <= 3) return { level: 'medium', score };
  return { level: 'strong', score };
}

// ✅ P-03: 모듈 레벨 상수
const MIN_PASSWORD_LENGTH = 6;

// ✅ 순수 함수 — 비밀번호 변경 유효성 검증
export function validatePasswordChange(input: ChangePasswordInput): string | null {
  if (input.currentPassword.length === 0) {
    return '현재 비밀번호를 입력하세요';
  }
  if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
    return `새 비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다`;
  }
  if (input.currentPassword === input.newPassword) {
    return '새 비밀번호는 현재 비밀번호와 달라야 합니다';
  }
  return null;
}
