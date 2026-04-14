"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { getTokenFromCookie } from "@/actions/get-token";

interface Post {
  id: number;
  title: string;
  body: string;
}

/**
 * 테스트: useSuspenseQuery의 queryFn 안에서 서버 액션으로 쿠키 토큰을 가져오는 경우
 *
 * 질문: SSR 시에도 정상 동작하는가?
 */
export function PostsWithServerAction() {
  const { data: posts } = useSuspenseQuery<Post[]>({
    queryKey: ["posts-server-action"],
    queryFn: async () => {
      // 서버 액션으로 쿠키에서 토큰 가져오기
      const token = await getTokenFromCookie();
      console.log("[Client] token from server action:", token);

      const res = await fetch(
        "https://jsonplaceholder.typicode.com/posts?_limit=5",
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {posts.map((post) => (
        <li
          key={post.id}
          style={{
            padding: "12px 16px",
            marginBottom: "8px",
            border: "1px solid #93c5fd",
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
