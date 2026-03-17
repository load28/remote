// A-07: barrel file public API만 노출, P-06: named export만

// Components
export { PlanList } from './ui/PlanList';
export { PlanItemRow } from './ui/PlanItemRow';

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
} from './model/usePlan';

export { activePlanIdAtom, isPlanPanelOpenAtom, openPlanAtom, closePlanAtom, togglePlanPanelAtom } from './model/planAtoms';

// Domain
export {
  calculateProgress,
  canDeletePlan,
  canAddItem,
  validateTitle,
  sortPlansByCreatedAt,
  filterIncompletePlans,
} from './model/planRules';

// Types
export type {
  Plan,
  PlanItem,
  CreatePlanInput,
  AddPlanItemInput,
  TogglePlanItemInput,
  DeletePlanItemInput,
} from './model/types';
