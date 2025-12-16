// Query parameter definitions and parsers
export {
  // Product search
  productSearchParams,
  productSearchParamsCache,
  serializeProductSearch,
  productSortOptions,
  type ProductSortOption,
  type ProductSearchParams,
  // General search
  searchParams,
  searchParamsCache,
  serializeSearch,
  searchTypeOptions,
  type SearchType,
  type SearchParams,
  // Dashboard
  dashboardParams,
  dashboardParamsCache,
  serializeDashboard,
  dashboardViewOptions,
  timeRangeOptions,
  type DashboardView,
  type TimeRange,
  type DashboardParams,
  // Custom parsers
  parseAsJson,
  parseAsDate,
  parseAsNumberRange,
  type NumberRange,
} from "./query-params";

// Serializers and utilities
export {
  ProductSearchSerializer,
  SearchSerializer,
  DashboardSerializer,
  mergeQueryParams,
  queryStringToObject,
  objectToQueryString,
  type SerializedState,
  type DeserializedState,
} from "./serializer";

// Custom hooks for each page
export {
  useProductSearchParams,
  useSearchParams,
  useDashboardParams,
} from "./hooks";

// Re-export nuqs utilities for convenience
export {
  useQueryState,
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsBoolean,
  parseAsArrayOf,
  parseAsStringLiteral,
} from "nuqs";
