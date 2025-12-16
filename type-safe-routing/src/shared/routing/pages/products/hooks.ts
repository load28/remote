"use client";

import { useQueryStates, type Options } from "nuqs";
import { productSearchParams } from "./params";

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
 *
 * // 특정 파라미터만 초기화
 * setParams({ q: '', categories: [] });
 * ```
 */
export function useProductSearchParams(options?: Options) {
  return useQueryStates(productSearchParams, options);
}
