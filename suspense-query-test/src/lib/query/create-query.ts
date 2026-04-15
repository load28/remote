import type { CreateQueryInput, QueryDefinition } from "./types";

const API_BASE =
  process.env.API_BASE_URL ?? "https://jsonplaceholder.typicode.com";

export function createQuery<T = unknown>(
  input: CreateQueryInput<T>
): QueryDefinition<T> {
  const { key, endpoint, auth, options: queryOptions } = input;

  return {
    key,
    endpoint,
    auth,

    options: {
      queryKey: key,
      queryFn: async () => {
        const res = await fetch(`/api/proxy${endpoint}`);
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
        return res.json() as Promise<T>;
      },
      ...queryOptions,
    },

    serverQueryFn: async (token?: string) => {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}${endpoint}`, { headers });
      if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
      return res.json() as Promise<T>;
    },
  };
}
