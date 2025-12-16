"use client";

import { useQueryStates, type Options } from "nuqs";
import {
  productSearchParams,
  searchParams,
  dashboardParams,
} from "./query-params";

/**
 * 상품 검색 쿼리 파라미터를 위한 훅
 *
 * @example
 * ```tsx
 * const [params, setParams] = useProductSearchParams();
 *
 * // 파라미터 읽기
 * console.log(params.q, params.page, params.sort);
 *
 * // 파라미터 업데이트
 * setParams({ q: 'new search', page: 1 });
 * ```
 */
export function useProductSearchParams(options?: Options) {
  return useQueryStates(productSearchParams, options);
}

/**
 * 일반 검색 쿼리 파라미터를 위한 훅
 *
 * @example
 * ```tsx
 * const [params, setParams] = useSearchParams();
 *
 * // 날짜 필터와 함께 사용
 * setParams({
 *   query: 'test',
 *   type: 'products',
 *   from: new Date('2024-01-01'),
 *   to: new Date('2024-12-31'),
 * });
 * ```
 */
export function useSearchParams(options?: Options) {
  return useQueryStates(searchParams, options);
}

/**
 * 대시보드 쿼리 파라미터를 위한 훅
 *
 * @example
 * ```tsx
 * const [params, setParams] = useDashboardParams();
 *
 * // 보기 모드 변경
 * setParams({ view: 'table', timeRange: 'week' });
 * ```
 */
export function useDashboardParams(options?: Options) {
  return useQueryStates(dashboardParams, options);
}
