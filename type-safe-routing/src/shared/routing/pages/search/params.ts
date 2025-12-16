import {
  createSearchParamsCache,
  parseAsString,
  parseAsInteger,
  parseAsStringLiteral,
  createSerializer,
} from "nuqs/server";
import { parseAsDate, parseAsJson } from "../../parsers";

/**
 * 검색 타입 옵션
 */
export const searchTypeOptions = ["all", "products", "users", "posts"] as const;
export type SearchType = (typeof searchTypeOptions)[number];

/**
 * 고급 필터 타입
 */
export interface SearchFilters {
  verified?: boolean;
  minRating?: number;
  tags?: string[];
}

/**
 * 일반 검색 쿼리 파라미터 정의
 */
export const searchParams = {
  /** 검색어 */
  query: parseAsString.withDefault(""),
  /** 검색 타입 */
  type: parseAsStringLiteral(searchTypeOptions).withDefault("all"),
  /** 시작 날짜 필터 */
  from: parseAsDate,
  /** 종료 날짜 필터 */
  to: parseAsDate,
  /** 페이지네이션 */
  page: parseAsInteger.withDefault(1),
  /** 고급 필터 (JSON 객체) */
  filters: parseAsJson<SearchFilters>(),
};

/** 서버 컴포넌트용 캐시 */
export const searchParamsCache = createSearchParamsCache(searchParams);

/** URL 생성용 시리얼라이저 */
export const serializeSearch = createSerializer(searchParams);

/** 파싱된 파라미터 타입 */
export type SearchParams = Awaited<ReturnType<typeof searchParamsCache.parse>>;

/** Serialize에 사용할 Input 타입 */
export type SearchParamsInput = {
  query?: string | null;
  type?: SearchType | null;
  from?: Date | null;
  to?: Date | null;
  page?: number | null;
  filters?: SearchFilters | null;
};
