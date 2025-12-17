// ============================================
// 공통 파서
// ============================================
export {
  parseAsJson,
  parseAsDate,
  parseAsNumberRange,
  type NumberRange,
} from "./parsers";

// ============================================
// 공통 유틸리티
// ============================================
export {
  mergeQueryParams,
  queryStringToObject,
  objectToQueryString,
  extractSearchParams,
  type SerializedState,
  type DeserializedState,
} from "./utils";

// ============================================
// 페이지별 라우팅 (개별 import 가능)
// ============================================

// Products
export {
  productSearchParams,
  productSearchParamsCache,
  serializeProductSearch,
  productSortOptions,
  ProductSearchSerializer,
  useProductSearchParams,
  type ProductSortOption,
  type ProductSearchParams,
  type ProductSearchParamsInput,
} from "./pages/products";

// Search
export {
  searchParams,
  searchParamsCache,
  serializeSearch,
  searchTypeOptions,
  SearchSerializer,
  useSearchParams,
  type SearchType,
  type SearchFilters,
  type SearchParams,
  type SearchParamsInput,
} from "./pages/search";

// Dashboard
export {
  dashboardParams,
  dashboardParamsCache,
  serializeDashboard,
  dashboardViewOptions,
  timeRangeOptions,
  DashboardSerializer,
  useDashboardParams,
  type DashboardView,
  type TimeRange,
  type DashboardParams,
  type DashboardParamsInput,
} from "./pages/dashboard";

// ============================================
// nuqs 유틸리티 re-export
// ============================================
export {
  useQueryState,
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsBoolean,
  parseAsArrayOf,
  parseAsStringLiteral,
} from "nuqs";
