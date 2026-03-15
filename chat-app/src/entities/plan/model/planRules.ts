// A-05: 비즈니스 로직 분리 — React 미사용 순수 함수
// P-03: 모듈 레벨 상수

import type { Plan, PlanItem } from './types';

// ✅ P-03, N-06: 모듈 레벨 상수
const MAX_ITEMS_PER_PLAN = 50;
const MAX_TITLE_LENGTH = 100;

// --- 진행률 계산 ---

export function calculateProgress(
  items: PlanItem[],
): { completed: number; total: number; percentage: number } {
  const total = items.length;
  const completed = items.filter((item) => item.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}

// --- 권한 판별 ---

export function canDeletePlan(plan: Plan, userId: string): boolean {
  return plan.createdBy === userId;
}

// --- 유효성 검증 ---

export function canAddItem(items: PlanItem[]): boolean {
  return items.length < MAX_ITEMS_PER_PLAN;
}

export function validateTitle(title: string): { isValid: boolean; reason: string } {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { isValid: false, reason: '제목을 입력해주세요.' };
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return { isValid: false, reason: `제목은 ${MAX_TITLE_LENGTH}자 이하로 입력해주세요.` };
  }
  return { isValid: true, reason: '' };
}

// --- 정렬 ---

export function sortPlansByCreatedAt(plans: Plan[]): Plan[] {
  return [...plans].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// --- 필터 ---

export function filterIncompletePlans(plans: Plan[]): Plan[] {
  return plans.filter((plan) => {
    if (plan.items.length === 0) return true;
    return plan.items.some((item) => !item.isCompleted);
  });
}
