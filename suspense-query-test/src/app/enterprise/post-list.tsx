"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { postsQueryOptions } from "@/lib/queries";

/**
 * 클라이언트 컴포넌트: 토큰을 전혀 모름
 *
 * - 초기 렌더: 서버에서 prefetch된 캐시 데이터 사용 (queryFn 실행 안 함)
 * - refetch: /api/posts Route Handler 호출 (토큰은 서버가 쿠키로 처리)
 */
export function PostList() {
  const { data: posts } = useSuspenseQuery(postsQueryOptions);

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {posts.map((post) => (
        <li
          key={post.id}
          style={{
            padding: "12px 16px",
            marginBottom: "8px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <strong>{post.title}</strong>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0" }}>
            {post.body.slice(0, 80)}...
          </p>
        </li>
      ))}
    </ul>
  );
}
