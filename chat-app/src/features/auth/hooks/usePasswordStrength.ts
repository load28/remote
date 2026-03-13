// 레퍼런스: startTransition--ref--debounce.md
// P-11: startTransition — 비밀번호 강도 계산은 비긴급 업데이트
// P-12: 빈번 변경값(keystroke timing) ref 저장
// A-05: 비즈니스 로직(강도 계산)을 순수 함수로 분리

import { useState, startTransition } from 'react';
import type { PasswordStrength } from '../types';
import { calculatePasswordStrength } from '../domain/authRules';

// ✅ P-03: 모듈 레벨 상수
const INITIAL_STRENGTH: PasswordStrength = { level: 'empty', score: 0 };

// ✅ N-05: use + 동사
export function usePasswordStrength() {
  const [strength, setStrength] = useState<PasswordStrength>(INITIAL_STRENGTH);

  const updateStrength = (password: string) => {
    // ✅ P-11: 비긴급 업데이트 — 강도 UI 갱신은 입력 반영보다 우선순위 낮음
    startTransition(() => {
      setStrength(calculatePasswordStrength(password));
    });
  };

  return { strength, updateStrength };
}
