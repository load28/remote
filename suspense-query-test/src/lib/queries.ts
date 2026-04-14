import { queryOptions } from "@tanstack/react-query";

interface Post {
  id: number;
  title: string;
  body: string;
}

/**
 * queryKey와 queryFn을 한 곳에서 관리
 *
 * - 서버: prefetchQuery에서 직접 외부 API + 토큰으로 호출
 * - 클라이언트: refetch 시 /api/posts (Route Handler 프록시)로 호출
 */
export const postsQueryOptions = queryOptions<Post[]>({
  queryKey: ["posts"],
  queryFn: async () => {
    // 클라이언트에서 refetch 시 실행됨
    // Route Handler가 쿠키에서 토큰을 읽어서 처리
    const res = await fetch("/api/posts");
    if (!res.ok) throw new Error("Failed to fetch posts");
    return res.json();
  },
});
