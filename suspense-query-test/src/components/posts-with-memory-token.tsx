"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

interface Post {
  id: number;
  title: string;
  body: string;
}

// 메모리에 토큰을 들고 있는 간단한 store
let memoryToken: string | null = null;

export function setMemoryToken(token: string) {
  memoryToken = token;
}

export function clearMemoryToken() {
  memoryToken = null;
}

export function getMemoryToken() {
  return memoryToken;
}

/**
 * 메모리 토큰으로 useSuspenseQuery 사용
 *
 * 문제: SSR 시 memoryToken은 항상 null (서버 메모리에는 토큰이 없음)
 * → 토큰 없이 요청이 나가거나, 토큰 검증 실패
 *
 * 하지만 localStorage처럼 ReferenceError가 나진 않음 (그냥 null)
 * → 에러가 아니라 "잘못된 요청"이 나가는 더 은밀한 버그
 */
export function PostsWithMemoryToken() {
  const { data: posts } = useSuspenseQuery<Post[]>({
    queryKey: ["posts-memory", memoryToken],
    queryFn: async () => {
      console.log("[queryFn] memoryToken:", memoryToken);

      const res = await fetch(
        "https://jsonplaceholder.typicode.com/posts?_limit=5",
        {
          headers: {
            ...(memoryToken && { Authorization: `Bearer ${memoryToken}` }),
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
        현재 메모리 토큰: <code>{memoryToken ?? "(null)"}</code>
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {posts.map((post) => (
          <li
            key={post.id}
            style={{
              padding: "12px 16px",
              marginBottom: "8px",
              border: "1px solid #fbbf24",
              borderRadius: "8px",
            }}
          >
            <strong>{post.title}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
