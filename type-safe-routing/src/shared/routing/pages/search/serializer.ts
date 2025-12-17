import {
  searchParamsCache,
  serializeSearch,
  type SearchParams,
  type SearchParamsInput,
} from "./params";
import {
  type SerializedState,
  type DeserializedState,
  extractSearchParams,
} from "../../utils";

/**
 * 일반 검색 페이지 Serializer
 */
export const SearchSerializer = {
  /**
   * 검색 상태를 URL 쿼리 문자열로 직렬화
   *
   * @example
   * ```ts
   * const result = SearchSerializer.serialize({
   *   query: '테스트',
   *   type: 'products',
   *   from: new Date('2024-01-01'),
   *   filters: { verified: true, minRating: 4 },
   * });
   * ```
   */
  serialize(state: SearchParamsInput): SerializedState<SearchParamsInput> {
    const queryString = serializeSearch(state);
    const searchParams = new URLSearchParams(queryString.slice(1));

    return {
      state,
      queryString,
      searchParams,
      toUrl: (baseUrl: string) => `${baseUrl}${queryString}`,
    };
  },

  /**
   * URL 쿼리 파라미터에서 검색 상태 복원
   */
  async deserialize(
    searchParams: Record<string, string | string[] | undefined>
  ): Promise<DeserializedState<SearchParams>> {
    try {
      const state = await searchParamsCache.parse(searchParams);
      return {
        state,
        success: true,
      };
    } catch (error) {
      const defaultState = await searchParamsCache.parse({});
      return {
        state: defaultState,
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  },

  /**
   * URL 문자열에서 검색 상태 복원
   */
  async deserializeFromUrl(url: string): Promise<DeserializedState<SearchParams>> {
    const params = extractSearchParams(url);
    return this.deserialize(params);
  },
};
