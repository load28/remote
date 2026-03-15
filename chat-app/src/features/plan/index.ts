// A-07: barrel file — FSD: entities에서 re-export + feature 전용 export
// P-06: named export만

// entities/plan에서 re-export (도메인 모델)
export {
  PlanList,
  PlanItemRow,
  useChannelPlans,
  usePlanDetail,
  useCreatePlan,
  useAddPlanItem,
  useTogglePlanItem,
  useDeletePlanItem,
  useDeletePlan,
  usePlanStore,
  calculateProgress,
  canDeletePlan,
  canAddItem,
  validateTitle,
  sortPlansByCreatedAt,
  filterIncompletePlans,
  PLAN_QUERY_KEY,
} from '@/entities/plan';

export type {
  Plan,
  PlanItem,
  CreatePlanInput,
  AddPlanItemInput,
  TogglePlanItemInput,
  DeletePlanItemInput,
} from '@/entities/plan';

// feature 전용 (사용자 인터랙션 UI)
export { PlanPanel, type PlanPermissions, type PlanPanelActions } from './components/PlanPanel';
export { CreatePlanForm } from './components/CreatePlanForm';
