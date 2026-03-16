// C-10: 파일당 1 exported 컴포넌트
// C-07: SRP — 플랜 목록 표시만 담당

import type { Plan } from '../model/types';
import { calculateProgress } from '../model/planRules';

// ✅ T-13: named exported interface
export interface PlanListProps {
  plans: Plan[];
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
}

export function PlanList({
  plans,
  selectedPlanId,
  onSelectPlan,
}: PlanListProps) {
  return (
    <nav aria-label="플랜 목록">
      <ul role="list" className="space-y-1">
        {plans.map((plan) => {
          const progress = calculateProgress(plan.items);
          const isSelected = plan.id === selectedPlanId;

          return (
            <li key={plan.id}>
              <button
                type="button"
                onClick={() => onSelectPlan(plan.id)}
                aria-current={isSelected ? 'true' : undefined}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  isSelected
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="block font-medium truncate">{plan.title}</span>
                {plan.items.length > 0 ? (
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {progress.completed}/{progress.total} 완료 ({progress.percentage}%)
                  </span>
                ) : (
                  <span className="block text-xs text-gray-400 mt-0.5">항목 없음</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {plans.length === 0 ? (
        <p className="text-sm text-gray-400 px-3 py-2">플랜이 없습니다</p>
      ) : null}
    </nav>
  );
}
