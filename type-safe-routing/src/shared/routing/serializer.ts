/**
 * 쿼리 파라미터 직렬화/역직렬화 유틸리티
 *
 * 특정 화면의 상태를 URL 쿼리 문자열로 변환하거나
 * URL에서 상태를 복원할 수 있습니다.
 */

import {
  serializeProductSearch,
  serializeSearch,
  serializeDashboard,
  productSearchParamsCache,
  searchParamsCache,
  dashboardParamsCache,
  type ProductSearchParams,
  type SearchParams,
  type DashboardParams,
} from "./query-params";

// ============================================
// 타입 정의
// ============================================

export interface SerializedState<T> {
  /** 원본 상태 객체 */
  state: T;
  /** 직렬화된 쿼리 문자열 (? 포함) */
  queryString: string;
  /** URLSearchParams 객체 */
  searchParams: URLSearchParams;
  /** 전체 URL (base URL 포함) */
  toUrl: (baseUrl: string) => string;
}

export interface DeserializedState<T> {
  /** 파싱된 상태 객체 */
  state: T;
  /** 파싱 성공 여부 */
  success: boolean;
  /** 파싱 오류 (있는 경우) */
  errors?: string[];
}

// ============================================
// 상품 검색 페이지 Serializer
// ============================================

export const ProductSearchSerializer = {
  /**
   * 상품 검색 상태를 URL 쿼리 문자열로 직렬화
   */
  serialize(state: Partial<ProductSearchParams>): SerializedState<Partial<ProductSearchParams>> {
    const queryString = serializeProductSearch(state);
    const searchParams = new URLSearchParams(queryString.slice(1));

    return {
      state,
      queryString,
      searchParams,
      toUrl: (baseUrl: string) => `${baseUrl}${queryString}`,
    };
  },

  /**
   * URL 쿼리 파라미터에서 상품 검색 상태 복원
   */
  deserialize(
    searchParams: Record<string, string | string[] | undefined>
  ): DeserializedState<ProductSearchParams> {
    try {
      const state = productSearchParamsCache.parse(searchParams);
      return {
        state,
        success: true,
      };
    } catch (error) {
      return {
        state: productSearchParamsCache.parse({}),
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  },

  /**
   * URL 문자열에서 상품 검색 상태 복원
   */
  deserializeFromUrl(url: string): DeserializedState<ProductSearchParams> {
    const urlObj = new URL(url, "http://localhost");
    const params: Record<string, string | string[]> = {};

    urlObj.searchParams.forEach((value, key) => {
      const existing = params[key];
      if (existing) {
        params[key] = Array.isArray(existing)
          ? [...existing, value]
          : [existing, value];
      } else {
        params[key] = value;
      }
    });

    return this.deserialize(params);
  },
};

// ============================================
// 일반 검색 페이지 Serializer
// ============================================

export const SearchSerializer = {
  serialize(state: Partial<SearchParams>): SerializedState<Partial<SearchParams>> {
    const queryString = serializeSearch(state);
    const searchParams = new URLSearchParams(queryString.slice(1));

    return {
      state,
      queryString,
      searchParams,
      toUrl: (baseUrl: string) => `${baseUrl}${queryString}`,
    };
  },

  deserialize(
    searchParams: Record<string, string | string[] | undefined>
  ): DeserializedState<SearchParams> {
    try {
      const state = searchParamsCache.parse(searchParams);
      return {
        state,
        success: true,
      };
    } catch (error) {
      return {
        state: searchParamsCache.parse({}),
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  },

  deserializeFromUrl(url: string): DeserializedState<SearchParams> {
    const urlObj = new URL(url, "http://localhost");
    const params: Record<string, string | string[]> = {};

    urlObj.searchParams.forEach((value, key) => {
      const existing = params[key];
      if (existing) {
        params[key] = Array.isArray(existing)
          ? [...existing, value]
          : [existing, value];
      } else {
        params[key] = value;
      }
    });

    return this.deserialize(params);
  },
};

// ============================================
// 대시보드 페이지 Serializer
// ============================================

export const DashboardSerializer = {
  serialize(state: Partial<DashboardParams>): SerializedState<Partial<DashboardParams>> {
    const queryString = serializeDashboard(state);
    const searchParams = new URLSearchParams(queryString.slice(1));

    return {
      state,
      queryString,
      searchParams,
      toUrl: (baseUrl: string) => `${baseUrl}${queryString}`,
    };
  },

  deserialize(
    searchParams: Record<string, string | string[] | undefined>
  ): DeserializedState<DashboardParams> {
    try {
      const state = dashboardParamsCache.parse(searchParams);
      return {
        state,
        success: true,
      };
    } catch (error) {
      return {
        state: dashboardParamsCache.parse({}),
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  },

  deserializeFromUrl(url: string): DeserializedState<DashboardParams> {
    const urlObj = new URL(url, "http://localhost");
    const params: Record<string, string | string[]> = {};

    urlObj.searchParams.forEach((value, key) => {
      const existing = params[key];
      if (existing) {
        params[key] = Array.isArray(existing)
          ? [...existing, value]
          : [existing, value];
      } else {
        params[key] = value;
      }
    });

    return this.deserialize(params);
  },
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 현재 URL에 쿼리 파라미터 병합
 */
export function mergeQueryParams(
  currentUrl: string,
  newParams: Record<string, string | number | boolean | null | undefined>
): string {
  const url = new URL(currentUrl, "http://localhost");

  Object.entries(newParams).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
  });

  return `${url.pathname}${url.search}`;
}

/**
 * 쿼리 파라미터를 객체로 변환
 */
export function queryStringToObject(
  queryString: string
): Record<string, string | string[]> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string | string[]> = {};

  params.forEach((value, key) => {
    const existing = result[key];
    if (existing) {
      result[key] = Array.isArray(existing)
        ? [...existing, value]
        : [existing, value];
    } else {
      result[key] = value;
    }
  });

  return result;
}

/**
 * 객체를 쿼리 문자열로 변환
 */
export function objectToQueryString(
  obj: Record<string, string | number | boolean | string[] | null | undefined>
): string {
  const params = new URLSearchParams();

  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, String(value));
    }
  });

  const result = params.toString();
  return result ? `?${result}` : "";
}
