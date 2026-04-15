"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { postsQuery } from "@/lib/queries/posts";

export function PostList() {
  const { data: posts } = useSuspenseQuery(postsQuery.options);

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
