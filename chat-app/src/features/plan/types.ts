// T-13: named exported interface
// T-15: optional 남용 금지 — assigneeId만 진짜 optional (미배정 가능)

// --- Plan 기본 타입 ---

export interface PlanItem {
  id: string;
  planId: string;
  content: string;
  isCompleted: boolean;
  assigneeId?: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  channelId: string;
  title: string;
  createdBy: string;
  createdAt: string;
  items: PlanItem[];
}

// --- Plan 입력 타입 ---

export interface CreatePlanInput {
  channelId: string;
  title: string;
}

export interface AddPlanItemInput {
  planId: string;
  content: string;
}

export interface TogglePlanItemInput {
  planId: string;
  itemId: string;
}

export interface DeletePlanItemInput {
  planId: string;
  itemId: string;
}
