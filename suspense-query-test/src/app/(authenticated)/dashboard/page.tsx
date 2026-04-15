import { Suspense } from "react";
import { prefetchAll } from "@/lib/query/prefetch";
import { postsQuery } from "@/lib/queries/posts";
import { HydrationProvider } from "@/providers/hydration-provider";
import { PostList } from "./post-list";

export default async function DashboardPage() {
  const dehydratedState = await prefetchAll([postsQuery]);

  return (
    <div>
      <h1>Dashboard</h1>
      <p style={{ color: "#64748b" }}>
        서버 prefetch + useSuspenseQuery
      </p>
      <HydrationProvider state={dehydratedState}>
        <Suspense fallback={<div style={{ color: "#94a3b8" }}>로딩 중...</div>}>
          <PostList />
        </Suspense>
      </HydrationProvider>
    </div>
  );
}
