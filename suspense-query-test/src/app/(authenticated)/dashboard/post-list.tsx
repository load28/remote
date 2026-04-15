"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { postsQueryOptions } from "@/lib/queries";

/**
 * 클라이언트 컴포넌트: 토큰을 전혀 모름
 *
 * - 초기: prefetch 캐시 사용 → queryFn 실행 안 함
 * - refetch: /api/proxy/posts → Proxy가 토큰 주입
 */
export function PostList() {
  const { data: posts } = useSuspenseQuery(postsQueryOptions);

  console.log("[PostList] 렌더, posts:", posts.length, "개");

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {posts.map((post) => (
        <li
          key={post.id}
          style={{
            padding: "12px 16px",
            marginBottom: 8,
            border: "1px solid #e2e8f0",
            borderRadius: 8,
          }}
        >
          <strong>{post.title}</strong>
        </li>
      ))}
    </ul>
  );
}
