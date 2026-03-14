// C-10: 파일당 1 exported 컴포넌트
// C-07: SRP — 사이드바 플랜 섹션만 담당

import { PlanList, CreatePlanForm } from '@/features/plan';
import type { Plan } from '@/features/plan';

// ✅ T-13: named exported interface
export interface ChatPlanSidebarProps {
  plans: Plan[];
  activePlanId: string | null;
  isPanelOpen: boolean;
  isCreating: boolean;
  onSelectPlan: (planId: string) => void;
  onCreatePlan: (title: string) => void;
  onTogglePanel: () => void;
}

export function ChatPlanSidebar({
  plans,
  activePlanId,
  isPanelOpen,
  isCreating,
  onSelectPlan,
  onCreatePlan,
  onTogglePanel,
}: ChatPlanSidebarProps) {
  return (
    <div className="px-2 py-3 border-t border-gray-700">
      <div className="flex items-center justify-between px-2 mb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">플랜</h2>
        <button
          type="button"
          onClick={onTogglePanel}
          aria-label={isPanelOpen ? '플랜 패널 닫기' : '플랜 패널 열기'}
          className="text-xs text-gray-400 hover:text-white"
        >
          {isPanelOpen ? '닫기' : '열기'}
        </button>
      </div>
      <PlanList
        plans={plans}
        selectedPlanId={activePlanId}
        onSelectPlan={onSelectPlan}
      />
      <div className="mt-2 px-1">
        <CreatePlanForm onSubmit={onCreatePlan} isSubmitting={isCreating} />
      </div>
    </div>
  );
}
