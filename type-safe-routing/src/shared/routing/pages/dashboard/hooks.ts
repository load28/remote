"use client";

import { useQueryStates, type Options } from "nuqs";
import { dashboardParams } from "./params";

/**
 * 대시보드 쿼리 파라미터를 위한 훅
 *
 * @example
 * ```tsx
 * const [params, setParams] = useDashboardParams();
 *
 * // 보기 모드 변경
 * setParams({ view: 'table', timeRange: 'week' });
 *
 * // 메트릭 선택
 * setParams({ metrics: ['revenue', 'orders', 'conversions'] });
 *
 * // 상세 패널 열기/닫기
 * setParams({ detailId: 'metric-123' });
 * setParams({ detailId: null });
 * ```
 */
export function useDashboardParams(options?: Options) {
  return useQueryStates(dashboardParams, options);
}
