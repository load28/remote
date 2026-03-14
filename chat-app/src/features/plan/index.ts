// A-07: barrel file public API만 노출, P-06: named export만

// Components
export { PlanPanel, type PlanPermissions, type PlanPanelActions } from './components/PlanPanel';
export { PlanList } from './components/PlanList';
export { PlanItemRow } from './components/PlanItemRow';
export { CreatePlanForm } from './components/CreatePlanForm';

// Hooks
export {
  useChannelPlans,
  usePlanDetail,
  useCreatePlan,
  useAddPlanItem,
  useTogglePlanItem,
  useDeletePlanItem,
  useDeletePlan,
  PLAN_QUERY_KEY,
} from './hooks/usePlan';

export { usePlanStore } from './hooks/usePlanStore';

// Domain
export {
  calculateProgress,
  canDeletePlan,
  canAddItem,
  validateTitle,
  sortPlansByCreatedAt,
  filterIncompletePlans,
} from './domain/planRules';

// Types
export type {
  Plan,
  PlanItem,
  CreatePlanInput,
  AddPlanItemInput,
  TogglePlanItemInput,
  DeletePlanItemInput,
} from './types';
