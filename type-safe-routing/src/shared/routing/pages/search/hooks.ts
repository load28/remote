"use client";

import { useQueryStates, type Options } from "nuqs";
import { searchParams } from "./params";

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
 *
 * // JSON 필터 사용
 * setParams({
 *   filters: { verified: true, minRating: 4 },
 * });
 * ```
 */
export function useSearchParams(options?: Options) {
  return useQueryStates(searchParams, options);
}
