import {
  createSearchParamsCache,
  parseAsString,
  parseAsInteger,
  parseAsBoolean,
  parseAsArrayOf,
  parseAsStringLiteral,
  createSerializer,
  type ParserBuilder,
} from "nuqs/server";

/**
 * 커스텀 파서: JSON 객체 파싱
 * URL에서 JSON 문자열을 파싱하여 타입 세이프한 객체로 변환
 */
export function parseAsJson<T>() {
  return {
    parse: (value: string) => {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    },
    serialize: (value: T) => JSON.stringify(value),
  } as ParserBuilder<T>;
}

/**
 * 커스텀 파서: ISO 날짜 문자열 파싱
 */
export const parseAsDate = {
  parse: (value: string) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  },
  serialize: (value: Date) => value.toISOString().split("T")[0],
} as ParserBuilder<Date>;

/**
 * 커스텀 파서: 숫자 범위 파싱 (예: "100-500")
 */
export interface NumberRange {
  min: number;
  max: number;
}

export const parseAsNumberRange = {
  parse: (value: string): NumberRange | null => {
    const [min, max] = value.split("-").map(Number);
    if (isNaN(min) || isNaN(max)) return null;
    return { min, max };
  },
  serialize: (value: NumberRange) => `${value.min}-${value.max}`,
} as ParserBuilder<NumberRange>;

// ============================================
// 상품 검색 페이지 쿼리 파라미터 정의
// ============================================

export const productSortOptions = [
  "price_asc",
  "price_desc",
  "newest",
  "popular",
] as const;

export type ProductSortOption = (typeof productSortOptions)[number];

export const productSearchParams = {
  // 검색 키워드
  q: parseAsString.withDefault(""),
  // 카테고리 필터 (다중 선택 가능)
  categories: parseAsArrayOf(parseAsString).withDefault([]),
  // 가격 범위
  priceRange: parseAsNumberRange.withDefault({ min: 0, max: 1000000 }),
  // 정렬 옵션
  sort: parseAsStringLiteral(productSortOptions).withDefault("newest"),
  // 페이지 번호
  page: parseAsInteger.withDefault(1),
  // 페이지당 아이템 수
  limit: parseAsInteger.withDefault(20),
  // 재고 있는 상품만 표시
  inStock: parseAsBoolean.withDefault(false),
};

// 서버 컴포넌트용 캐시 생성
export const productSearchParamsCache =
  createSearchParamsCache(productSearchParams);

// URL 생성용 시리얼라이저
export const serializeProductSearch = createSerializer(productSearchParams);

// 타입 추출
export type ProductSearchParams = ReturnType<
  typeof productSearchParamsCache.parse
>;

// ============================================
// 검색 페이지 쿼리 파라미터 정의
// ============================================

export const searchTypeOptions = ["all", "products", "users", "posts"] as const;
export type SearchType = (typeof searchTypeOptions)[number];

export const searchParams = {
  // 검색어
  query: parseAsString.withDefault(""),
  // 검색 타입
  type: parseAsStringLiteral(searchTypeOptions).withDefault("all"),
  // 날짜 필터
  from: parseAsDate,
  to: parseAsDate,
  // 페이지네이션
  page: parseAsInteger.withDefault(1),
  // 고급 필터 (JSON 객체)
  filters: parseAsJson<{
    verified?: boolean;
    minRating?: number;
    tags?: string[];
  }>(),
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serializeSearch = createSerializer(searchParams);
export type SearchParams = ReturnType<typeof searchParamsCache.parse>;

// ============================================
// 대시보드 페이지 쿼리 파라미터 정의
// ============================================

export const dashboardViewOptions = ["grid", "list", "table"] as const;
export type DashboardView = (typeof dashboardViewOptions)[number];

export const timeRangeOptions = [
  "today",
  "week",
  "month",
  "quarter",
  "year",
] as const;
export type TimeRange = (typeof timeRangeOptions)[number];

export const dashboardParams = {
  // 보기 모드
  view: parseAsStringLiteral(dashboardViewOptions).withDefault("grid"),
  // 시간 범위
  timeRange: parseAsStringLiteral(timeRangeOptions).withDefault("month"),
  // 선택된 메트릭들
  metrics: parseAsArrayOf(parseAsString).withDefault(["revenue", "users"]),
  // 비교 모드 활성화
  compare: parseAsBoolean.withDefault(false),
  // 상세 패널 열기
  detailId: parseAsString,
};

export const dashboardParamsCache = createSearchParamsCache(dashboardParams);
export const serializeDashboard = createSerializer(dashboardParams);
export type DashboardParams = ReturnType<typeof dashboardParamsCache.parse>;
