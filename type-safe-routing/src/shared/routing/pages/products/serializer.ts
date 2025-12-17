import {
  productSearchParamsCache,
  serializeProductSearch,
  type ProductSearchParams,
  type ProductSearchParamsInput,
} from "./params";
import {
  type SerializedState,
  type DeserializedState,
  extractSearchParams,
} from "../../utils";

/**
 * 상품 검색 페이지 Serializer
 * URL 쿼리 파라미터의 직렬화/역직렬화를 담당합니다.
 */
export const ProductSearchSerializer = {
  /**
   * 상품 검색 상태를 URL 쿼리 문자열로 직렬화
   *
   * @example
   * ```ts
   * const result = ProductSearchSerializer.serialize({
   *   q: '노트북',
   *   categories: ['electronics'],
   *   sort: 'price_asc',
   * });
   *
   * console.log(result.queryString);
   * // ?q=노트북&categories=electronics&sort=price_asc
   *
   * console.log(result.toUrl('/products'));
   * // /products?q=노트북&categories=electronics&sort=price_asc
   * ```
   */
  serialize(
    state: ProductSearchParamsInput
  ): SerializedState<ProductSearchParamsInput> {
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
   *
   * @example
   * ```ts
   * const result = await ProductSearchSerializer.deserialize({
   *   q: 'test',
   *   page: '2',
   * });
   *
   * console.log(result.state);
   * // { q: 'test', page: 2, categories: [], ... }
   * ```
   */
  async deserialize(
    searchParams: Record<string, string | string[] | undefined>
  ): Promise<DeserializedState<ProductSearchParams>> {
    try {
      const state = await productSearchParamsCache.parse(searchParams);
      return {
        state,
        success: true,
      };
    } catch (error) {
      const defaultState = await productSearchParamsCache.parse({});
      return {
        state: defaultState,
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  },

  /**
   * URL 문자열에서 상품 검색 상태 복원
   *
   * @example
   * ```ts
   * const result = await ProductSearchSerializer.deserializeFromUrl(
   *   '/products?q=test&page=2'
   * );
   * ```
   */
  async deserializeFromUrl(url: string): Promise<DeserializedState<ProductSearchParams>> {
    const params = extractSearchParams(url);
    return this.deserialize(params);
  },
};
