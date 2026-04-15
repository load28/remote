import type { UseSuspenseQueryOptions } from "@tanstack/react-query";

type QueryOptions<T> = Omit<
  UseSuspenseQueryOptions<T>,
  "queryKey" | "queryFn"
>;

export interface CreateQueryInput<T = unknown> {
  key: string[];
  endpoint: string;
  auth: boolean;
  options?: QueryOptions<T>;
}

export interface QueryDefinition<T = unknown> {
  key: string[];
  endpoint: string;
  auth: boolean;
  options: UseSuspenseQueryOptions<T>;
  serverQueryFn: (token?: string) => Promise<T>;
}
