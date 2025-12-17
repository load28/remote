/**
 * 쿼리 파라미터 유틸리티 함수 모음
 */

/**
 * 직렬화된 상태 인터페이스
 */
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

/**
 * 역직렬화된 상태 인터페이스
 */
export interface DeserializedState<T> {
  /** 파싱된 상태 객체 */
  state: T;
  /** 파싱 성공 여부 */
  success: boolean;
  /** 파싱 오류 (있는 경우) */
  errors?: string[];
}

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

/**
 * URL에서 searchParams 객체 추출
 */
export function extractSearchParams(
  url: string
): Record<string, string | string[]> {
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

  return params;
}
