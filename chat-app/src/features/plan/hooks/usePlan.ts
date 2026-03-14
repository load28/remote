// S-04: TanStack Query 사용, S-17: mutation 훅 onSuccess 내장 금지
// N-05: use + 동사, P-13: signal abort

import { useQuery, useMutation } from '@tanstack/react-query';
import { planApi } from '../api/planApi';
import type { AddPlanItemInput, TogglePlanItemInput, DeletePlanItemInput } from '../types';

// ✅ P-03: 모듈 레벨 상수
export const PLAN_QUERY_KEY = ['plans'] as const;

// --- Plan 쿼리 ---

export function useChannelPlans(channelId: string) {
  return useQuery({
    queryKey: [...PLAN_QUERY_KEY, channelId],
    queryFn: ({ signal }) => planApi.getByChannel(channelId, signal),
    enabled: !!channelId,
  });
}

export function usePlanDetail(planId: string) {
  return useQuery({
    queryKey: [...PLAN_QUERY_KEY, 'detail', planId],
    queryFn: ({ signal }) => planApi.getById(planId, signal),
    enabled: !!planId,
  });
}

// --- Plan 뮤테이션 ---

// ✅ S-17: mutationFn만 정의, onSuccess는 사용처에서
export function useCreatePlan(userId: string) {
  return useMutation({
    mutationFn: (input: { channelId: string; title: string }) =>
      planApi.create(input, userId),
  });
}

export function useAddPlanItem(userId: string) {
  return useMutation({
    mutationFn: (input: AddPlanItemInput) =>
      planApi.addItem(input, userId),
  });
}

export function useTogglePlanItem() {
  return useMutation({
    mutationFn: (input: TogglePlanItemInput) =>
      planApi.toggleItem(input),
  });
}

export function useDeletePlanItem() {
  return useMutation({
    mutationFn: (input: DeletePlanItemInput) =>
      planApi.deleteItem(input),
  });
}

export function useDeletePlan() {
  return useMutation({
    mutationFn: (planId: string) =>
      planApi.deletePlan(planId),
  });
}
