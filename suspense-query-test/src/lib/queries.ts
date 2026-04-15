import { queryOptions } from "@tanstack/react-query";

interface Post {
  id: number;
  title: string;
  body: string;
}

/**
 * queryFn은 토큰을 전혀 모른다.
 *
 * - /api/posts (Route Handler)를 호출할 뿐
 * - 토큰은 Route Handler가 httpOnly 쿠키에서 읽어서 처리
 * - 이 queryFn은 클라이언트에서만 실행됨 (prefetch 패턴 사용 시)
 */
export const postsQueryOptions = queryOptions<Post[]>({
  queryKey: ["posts"],
  queryFn: async () => {
    const res = await fetch("/api/posts?limit=5");
    if (!res.ok) throw new Error("Failed to fetch posts");
    return res.json();
  },
});
