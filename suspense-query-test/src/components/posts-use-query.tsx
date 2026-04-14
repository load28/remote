"use client";

import { useQuery } from "@tanstack/react-query";

interface Post {
  id: number;
  title: string;
  body: string;
}

/**
 * 비교: useQuery에서 동일하게 localStorage 접근
 * → useSuspenseQuery와 동일한 조건에서 SSR 시 어떻게 동작하는가?
 */
export function PostsUseQuery() {
  const { data: posts, status, error } = useQuery<Post[]>({
    queryKey: ["posts-usequery"],
    queryFn: async () => {
      console.log("[useQuery] queryFn 실행됨, typeof window:", typeof window);
      const token = localStorage.getItem("access_token");
      console.log("[useQuery] token:", token);

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
    <div>
      <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>
        status: <code>{status}</code>
        {error && (
          <>
            {" "}/ error: <code style={{ color: "#ef4444" }}>{error.message}</code>
          </>
        )}
      </p>
      {posts && (
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
