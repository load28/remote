// S-12: ref/state 동기화 타이밍 확인 — 토글 후 포커스 유지
// S-11: 렌더에 안 쓰이는 값 ref (inputRef — DOM 참조)

import { useRef, useState } from 'react';
import type { PasswordStrength } from '../types';

// ✅ P-03: 모듈 레벨 상수
const STRENGTH_COLORS: Record<PasswordStrength['level'], string> = {
  empty: 'bg-gray-200',
  weak: 'bg-red-500',
  medium: 'bg-yellow-500',
  strong: 'bg-green-500',
};

const STRENGTH_LABELS: Record<PasswordStrength['level'], string> = {
  empty: '',
  weak: '약함',
  medium: '보통',
  strong: '강함',
};

// ✅ T-13: named exported interface
export interface PasswordFieldProps {
  id: string;
  value: string;
  strength: PasswordStrength;
  isDisabled: boolean; // N-04: Boolean is 접두사
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function PasswordField({ id, value, strength, isDisabled, onChange }: PasswordFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // N-04
  // ✅ S-11: DOM ref — 렌더에 안 쓰이는 값
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggleVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
    // ✅ S-12: ref/state 동기화 — 토글 후 포커스 복원
    // requestAnimationFrame으로 state 업데이트 후 DOM 반영 보장
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <div>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type={isPasswordVisible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete="current-password"
          placeholder="비밀번호를 입력하세요"
          disabled={isDisabled}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        {/* ✅ T-11: 접근성 — aria-label */}
        <button
          type="button"
          onClick={handleToggleVisibility}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
          aria-label={isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
          tabIndex={-1}
        >
          {isPasswordVisible ? '숨김' : '보기'}
        </button>
      </div>

      {/* 비밀번호 강도 표시 */}
      {strength.level !== 'empty' ? (
        <div className="mt-1 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${STRENGTH_COLORS[strength.level]}`}
              style={{ width: `${(strength.score / 5) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{STRENGTH_LABELS[strength.level]}</span>
        </div>
      ) : null}
    </div>
  );
}
