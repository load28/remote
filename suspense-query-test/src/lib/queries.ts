import { queryOptions } from "@tanstack/react-query";

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

/**
 * 클라이언트 refetch용 queryOptions
 *
 * - queryKey: 서버 prefetch와 공유
 * - queryFn: 클라이언트에서 refetch 시에만 실행 (프록시 경유)
 */
export const postsQueryOptions = queryOptions<Post[]>({
  queryKey: ["posts"],
  queryFn: async () => {
    console.log("[Client queryFn] /api/proxy/posts 호출");
    const res = await fetch("/api/proxy/posts?_limit=5");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },
  staleTime: 10 * 1000, // 10초 후 stale → refetch 테스트 가능
});
