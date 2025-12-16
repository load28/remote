import {
  createSearchParamsCache,
  parseAsString,
  parseAsInteger,
  parseAsBoolean,
  parseAsArrayOf,
  parseAsStringLiteral,
  createSerializer,
} from "nuqs/server";
import { parseAsNumberRange } from "../../parsers";

/**
 * 상품 정렬 옵션
 */
export const productSortOptions = [
  "price_asc",
  "price_desc",
  "newest",
  "popular",
] as const;

export type ProductSortOption = (typeof productSortOptions)[number];

/**
 * 상품 검색 쿼리 파라미터 정의
 */
export const productSearchParams = {
  /** 검색 키워드 */
  q: parseAsString.withDefault(""),
  /** 카테고리 필터 (다중 선택 가능) */
  categories: parseAsArrayOf(parseAsString).withDefault([]),
  /** 가격 범위 */
  priceRange: parseAsNumberRange.withDefault({ min: 0, max: 1000000 }),
  /** 정렬 옵션 */
  sort: parseAsStringLiteral(productSortOptions).withDefault("newest"),
  /** 페이지 번호 */
  page: parseAsInteger.withDefault(1),
  /** 페이지당 아이템 수 */
  limit: parseAsInteger.withDefault(20),
  /** 재고 있는 상품만 표시 */
  inStock: parseAsBoolean.withDefault(false),
};

/** 서버 컴포넌트용 캐시 */
export const productSearchParamsCache = createSearchParamsCache(productSearchParams);

/** URL 생성용 시리얼라이저 */
export const serializeProductSearch = createSerializer(productSearchParams);

/** 파싱된 파라미터 타입 */
export type ProductSearchParams = Awaited<ReturnType<typeof productSearchParamsCache.parse>>;

/** Serialize에 사용할 Partial 타입 */
export type ProductSearchParamsInput = {
  q?: string | null;
  categories?: string[] | null;
  priceRange?: { min: number; max: number } | null;
  sort?: ProductSortOption | null;
  page?: number | null;
  limit?: number | null;
  inStock?: boolean | null;
};
