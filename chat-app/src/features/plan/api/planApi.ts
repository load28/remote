// A-06: httpClient 래퍼만 import
// A-05: 비즈니스 로직 없음 — 데이터 접근만

import { httpClient } from '@/shared/lib/httpClient';
import type {
  Plan,
  PlanItem,
  CreatePlanInput,
  AddPlanItemInput,
  TogglePlanItemInput,
  DeletePlanItemInput,
} from '../types';

export const planApi = {
  getByChannel: (channelId: string, signal?: AbortSignal): Promise<Plan[]> =>
    httpClient.get(`/api/channels/${channelId}/plans`, { signal }),

  getById: (planId: string, signal?: AbortSignal): Promise<Plan> =>
    httpClient.get(`/api/plans/${planId}`, { signal }),

  create: (input: CreatePlanInput, userId: string): Promise<Plan> =>
    httpClient.post('/api/plans', { ...input, userId }),

  addItem: (input: AddPlanItemInput, userId: string): Promise<PlanItem> =>
    httpClient.post(`/api/plans/${input.planId}/items`, { content: input.content, userId }),

  toggleItem: (input: TogglePlanItemInput): Promise<PlanItem> =>
    httpClient.post(`/api/plans/${input.planId}/items/${input.itemId}/toggle`, {}),

  deleteItem: (input: DeletePlanItemInput): Promise<void> =>
    httpClient.delete(`/api/plans/${input.planId}/items/${input.itemId}`),

  deletePlan: (planId: string): Promise<void> =>
    httpClient.delete(`/api/plans/${planId}`),
};
