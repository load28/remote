"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

interface Post {
  id: number;
  title: string;
  body: string;
}

/**
 * 문제 재현: queryFn 안에서 localStorage로 토큰을 가져옴
 * → SSR 시 서버에서 실행되면서 "localStorage is not defined" 에러 발생
 */
export function ProtectedPostsBroken() {
  const { data: posts } = useSuspenseQuery<Post[]>({
    queryKey: ["posts-broken"],
    queryFn: async () => {
      // SSR 시 여기서 터짐: localStorage는 브라우저 전용 API
      const token = localStorage.getItem("access_token");

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
            border: "1px solid #fca5a5",
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
