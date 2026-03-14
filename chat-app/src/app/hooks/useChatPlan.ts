// A-04: 높은 응집도 — Plan 관련 로직 응집
// useChatThread 패턴 동일

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useChannelPlans,
  useCreatePlan,
  useAddPlanItem,
  useTogglePlanItem,
  useDeletePlanItem,
  useDeletePlan,
  usePlanStore,
  canDeletePlan,
  canAddItem,
  PLAN_QUERY_KEY,
} from '@/features/plan';
import type { Plan } from '@/features/plan';
import type { PlanPanelActions, PlanPermissions } from '@/features/plan';
import type { ChatPlanSidebarProps } from '../components/ChatPlanSidebar';

export function useChatPlan(channelId: string, currentUserId: string) {
  const queryClient = useQueryClient();
  const { data: plans = [] } = useChannelPlans(channelId);
  const createPlan = useCreatePlan(currentUserId);
  const addPlanItem = useAddPlanItem(currentUserId);
  const togglePlanItem = useTogglePlanItem();
  const deletePlanItem = useDeletePlanItem();
  const deletePlan = useDeletePlan();

  const activePlanId = usePlanStore((s) => s.activePlanId);
  const isPlanPanelOpen = usePlanStore((s) => s.isPlanPanelOpen);
  const openPlan = usePlanStore((s) => s.openPlan);
  const closePlan = usePlanStore((s) => s.closePlan);
  const togglePlanPanel = usePlanStore((s) => s.togglePlanPanel);

  const activePlan = plans.find((p) => p.id === activePlanId) ?? null;

  const invalidatePlans = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [...PLAN_QUERY_KEY, channelId] });
  }, [queryClient, channelId]);

  const handleCreatePlan = useCallback(
    (title: string) => {
      createPlan.mutate({ channelId, title }, { onSuccess: (plan) => { invalidatePlans(); openPlan(plan.id); } });
    },
    [createPlan, channelId, invalidatePlans, openPlan],
  );

  const handleAddItem = useCallback(
    (content: string) => {
      if (!activePlanId) return;
      addPlanItem.mutate({ planId: activePlanId, content }, { onSuccess: invalidatePlans });
    },
    [addPlanItem, activePlanId, invalidatePlans],
  );

  const handleToggleItem = useCallback(
    (itemId: string) => {
      if (!activePlanId) return;
      togglePlanItem.mutate({ planId: activePlanId, itemId }, { onSuccess: invalidatePlans });
    },
    [togglePlanItem, activePlanId, invalidatePlans],
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      if (!activePlanId) return;
      deletePlanItem.mutate({ planId: activePlanId, itemId }, { onSuccess: invalidatePlans });
    },
    [deletePlanItem, activePlanId, invalidatePlans],
  );

  const handleDeletePlan = useCallback(() => {
    if (!activePlanId) return;
    deletePlan.mutate(activePlanId, { onSuccess: () => { invalidatePlans(); closePlan(); } });
  }, [deletePlan, activePlanId, invalidatePlans, closePlan]);

  const permissions: PlanPermissions = {
    canAdd: activePlan ? canAddItem(activePlan.items) : false,
    canDelete: activePlan ? canDeletePlan(activePlan, currentUserId) : false,
  };

  const panelActions: PlanPanelActions = {
    onAddItem: handleAddItem,
    onToggleItem: handleToggleItem,
    onDeleteItem: handleDeleteItem,
    onDeletePlan: handleDeletePlan,
    onClose: closePlan,
    isAddingItem: addPlanItem.isPending,
  };

  const sidebarProps: ChatPlanSidebarProps = {
    plans,
    activePlanId: activePlan?.id ?? null,
    isPanelOpen: isPlanPanelOpen,
    isCreating: createPlan.isPending,
    onSelectPlan: openPlan,
    onCreatePlan: handleCreatePlan,
    onTogglePanel: togglePlanPanel,
  };

  return {
    activePlan,
    isPlanPanelOpen,
    permissions,
    panelActions,
    sidebarProps,
  };
}
