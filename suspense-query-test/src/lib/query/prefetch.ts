import "server-only";

import { QueryClient, dehydrate } from "@tanstack/react-query";
import { verifySession } from "@/lib/dal";
import type { QueryDefinition } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function prefetchAll(queries: QueryDefinition<any>[]) {
  const needsAuth = queries.some((q) => q.auth);
  const token = needsAuth ? (await verifySession()).token : undefined;

  const queryClient = new QueryClient();

  await Promise.all(
    queries.map((query) =>
      queryClient.prefetchQuery({
        queryKey: query.key,
        queryFn: () =>
          query.auth ? query.serverQueryFn(token) : query.serverQueryFn(),
      })
    )
  );

  return dehydrate(queryClient);
}
