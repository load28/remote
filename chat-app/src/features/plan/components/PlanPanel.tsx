// 레퍼런스: interactive--checklist--controlled.md
// C-07: SRP — 플랜 상세 + 항목 관리 패널
// C-04: props 그룹화로 7개 이하 유지

import { useState } from 'react';
import type { Plan } from '../types';
import { calculateProgress, canAddItem } from '../domain/planRules';
import { PlanItemRow } from './PlanItemRow';

// ✅ T-13: named exported interface (그룹화)
export interface PlanPermissions {
  canAdd: boolean;
  canDelete: boolean;
}

export interface PlanPanelActions {
  onAddItem: (content: string) => void;
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onDeletePlan: () => void;
  onClose: () => void;
  isAddingItem: boolean;
}

export interface PlanPanelProps {
  plan: Plan;
  permissions: PlanPermissions;
  onAction: PlanPanelActions;
}

export function PlanPanel({ plan, permissions, onAction }: PlanPanelProps) {
  const [newItemContent, setNewItemContent] = useState('');

  const progress = calculateProgress(plan.items);
  const canAddMoreItems = canAddItem(plan.items);

  // ✅ P-05: inline style 회피 — 동적 값을 변수로 추출
  const progressBarWidth = { width: `${progress.percentage}%` } as const;

  // ✅ N-03: 내부 handle*, props on*
  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemContent.trim();
    if (!trimmed) return;
    onAction.onAddItem(trimmed);
    setNewItemContent('');
  };

  return (
    <aside className="w-80 border-l border-gray-200 flex flex-col bg-white" aria-label="플랜 상세">
      <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 truncate flex-1">{plan.title}</h2>
        <div className="flex items-center gap-2">
          {permissions.canDelete ? (
            <button
              type="button"
              onClick={onAction.onDeletePlan}
              aria-label="플랜 삭제"
              className="text-gray-400 hover:text-red-500 text-sm"
            >
              삭제
            </button>
          ) : null}
          <button
            type="button"
            onClick={onAction.onClose}
            aria-label="플랜 패널 닫기"
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>
      </header>

      {plan.items.length > 0 ? (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>{progress.completed}/{progress.total} 완료</span>
            <span>{progress.percentage}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="플랜 진행률"
            className="h-2 bg-gray-200 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={progressBarWidth}
            />
          </div>
        </div>
      ) : null}

      <ul role="list" className="flex-1 overflow-y-auto px-2 py-2">
        {plan.items.map((item) => (
          <PlanItemRow
            key={item.id}
            item={item}
            canEdit={true}
            onToggle={() => onAction.onToggleItem(item.id)}
            onDelete={() => onAction.onDeleteItem(item.id)}
          />
        ))}
        {plan.items.length === 0 ? (
          <li className="text-sm text-gray-400 text-center py-8">
            아직 항목이 없습니다. 아래에서 추가해보세요.
          </li>
        ) : null}
      </ul>

      {permissions.canAdd && canAddMoreItems ? (
        <form onSubmit={handleSubmitItem} className="px-4 py-3 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemContent}
              onChange={(e) => setNewItemContent(e.target.value)}
              placeholder="새 항목 추가..."
              aria-label="새 항목 내용"
              disabled={onAction.isAddingItem}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={onAction.isAddingItem || !newItemContent.trim()}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              추가
            </button>
          </div>
        </form>
      ) : null}
    </aside>
  );
}
