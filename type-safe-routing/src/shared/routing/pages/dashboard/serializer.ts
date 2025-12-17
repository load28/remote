import {
  dashboardParamsCache,
  serializeDashboard,
  type DashboardParams,
  type DashboardParamsInput,
} from "./params";
import {
  type SerializedState,
  type DeserializedState,
  extractSearchParams,
} from "../../utils";

/**
 * 대시보드 페이지 Serializer
 */
export const DashboardSerializer = {
  /**
   * 대시보드 상태를 URL 쿼리 문자열로 직렬화
   *
   * @example
   * ```ts
   * const result = DashboardSerializer.serialize({
   *   view: 'table',
   *   timeRange: 'quarter',
   *   metrics: ['revenue', 'orders', 'conversions'],
   *   compare: true,
   * });
   * ```
   */
  serialize(state: DashboardParamsInput): SerializedState<DashboardParamsInput> {
    const queryString = serializeDashboard(state);
    const searchParams = new URLSearchParams(queryString.slice(1));

    return {
      state,
      queryString,
      searchParams,
      toUrl: (baseUrl: string) => `${baseUrl}${queryString}`,
    };
  },

  /**
   * URL 쿼리 파라미터에서 대시보드 상태 복원
   */
  async deserialize(
    searchParams: Record<string, string | string[] | undefined>
  ): Promise<DeserializedState<DashboardParams>> {
    try {
      const state = await dashboardParamsCache.parse(searchParams);
      return {
        state,
        success: true,
      };
    } catch (error) {
      const defaultState = await dashboardParamsCache.parse({});
      return {
        state: defaultState,
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  },

  /**
   * URL 문자열에서 대시보드 상태 복원
   */
  async deserializeFromUrl(url: string): Promise<DeserializedState<DashboardParams>> {
    const params = extractSearchParams(url);
    return this.deserialize(params);
  },
};
