// C-10: 파일당 1 exported 컴포넌트
// S-13: controlled 컴포넌트

import { useState } from 'react';
import { validateTitle } from '../domain/planRules';

// ✅ T-13: named exported interface
export interface CreatePlanFormProps {
  onSubmit: (title: string) => void;
  isSubmitting: boolean;
}

export function CreatePlanForm({ onSubmit, isSubmitting }: CreatePlanFormProps) {
  const [title, setTitle] = useState('');

  // S-03: validation은 title에서 파생 — state 저장 금지, 렌더 중 직접 계산
  const validation = validateTitle(title.trim());

  // ✅ N-03: 내부 handle*, props on*
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="새 플랜 제목..."
        aria-label="새 플랜 제목"
        disabled={isSubmitting}
        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <button
        type="submit"
        disabled={isSubmitting || !validation.isValid}
        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '생성 중...' : '생성'}
      </button>
    </form>
  );
}
