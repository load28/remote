import {
  createSearchParamsCache,
  parseAsString,
  parseAsBoolean,
  parseAsArrayOf,
  parseAsStringLiteral,
  createSerializer,
} from "nuqs/server";

/**
 * 대시보드 보기 모드 옵션
 */
export const dashboardViewOptions = ["grid", "list", "table"] as const;
export type DashboardView = (typeof dashboardViewOptions)[number];

/**
 * 시간 범위 옵션
 */
export const timeRangeOptions = [
  "today",
  "week",
  "month",
  "quarter",
  "year",
] as const;
export type TimeRange = (typeof timeRangeOptions)[number];

/**
 * 대시보드 쿼리 파라미터 정의
 */
export const dashboardParams = {
  /** 보기 모드 */
  view: parseAsStringLiteral(dashboardViewOptions).withDefault("grid"),
  /** 시간 범위 */
  timeRange: parseAsStringLiteral(timeRangeOptions).withDefault("month"),
  /** 선택된 메트릭들 */
  metrics: parseAsArrayOf(parseAsString).withDefault(["revenue", "users"]),
  /** 비교 모드 활성화 */
  compare: parseAsBoolean.withDefault(false),
  /** 상세 패널 열기 */
  detailId: parseAsString,
};

/** 서버 컴포넌트용 캐시 */
export const dashboardParamsCache = createSearchParamsCache(dashboardParams);

/** URL 생성용 시리얼라이저 */
export const serializeDashboard = createSerializer(dashboardParams);

/** 파싱된 파라미터 타입 */
export type DashboardParams = Awaited<ReturnType<typeof dashboardParamsCache.parse>>;

/** Serialize에 사용할 Input 타입 */
export type DashboardParamsInput = {
  view?: DashboardView | null;
  timeRange?: TimeRange | null;
  metrics?: string[] | null;
  compare?: boolean | null;
  detailId?: string | null;
};
