"use client";

import { useSuspenseQuery, skipToken } from "@tanstack/react-query";
import { useToken } from "@/hooks/use-token";

interface Post {
  id: number;
  title: string;
  body: string;
}

/**
 * 해결: skipToken으로 토큰 없을 때 쿼리 실행을 건너뜀
 *
 * 흐름:
 * 1. SSR → useToken()이 null 반환 → skipToken으로 쿼리 스킵 (에러 없음)
 * 2. 하이드레이션 → useToken()이 localStorage에서 토큰 반환 → queryFn 실행
 * 3. Suspense fallback → 데이터 도착 후 리스트 렌더링
 */
export function ProtectedPostsFixed() {
  const token = useToken();

  const { data: posts } = useSuspenseQuery<Post[]>({
    queryKey: ["posts-fixed", token],
    queryFn: token
      ? async () => {
          await new Promise((resolve) => setTimeout(resolve, 1500));

          const res = await fetch(
            "https://jsonplaceholder.typicode.com/posts?_limit=5",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!res.ok) throw new Error("Failed to fetch posts");
          return res.json();
        }
      : skipToken,
  });

  if (!posts) {
    return (
      <div
        style={{
          padding: "16px",
          border: "1px solid #fbbf24",
          borderRadius: "8px",
          backgroundColor: "#fffbeb",
        }}
      >
        토큰이 없습니다. 아래 버튼으로 토큰을 설정해주세요.
      </div>
    );
  }

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {posts.map((post) => (
        <li
          key={post.id}
          style={{
            padding: "12px 16px",
            marginBottom: "8px",
            border: "1px solid #86efac",
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
