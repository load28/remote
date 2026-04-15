import { cookies } from "next/headers";

const API_BASE = process.env.API_BASE_URL ?? "https://jsonplaceholder.typicode.com";

/**
 * 전용 Route Handler가 필요한 경우:
 * - 여러 외부 API를 조합해서 하나의 응답으로 만들 때
 * - 응답을 가공해야 할 때
 * - 비즈니스 로직이 있을 때
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 1. 여러 API를 동시에 호출
  const [postsRes, usersRes, todosRes] = await Promise.all([
    fetch(`${API_BASE}/posts?_limit=5`, { headers }),
    fetch(`${API_BASE}/users?_limit=3`, { headers }),
    fetch(`${API_BASE}/todos?_limit=10`, { headers }),
  ]);

  const [posts, users, todos] = await Promise.all([
    postsRes.json(),
    usersRes.json(),
    todosRes.json(),
  ]);

  // 2. 응답 가공 — 프론트에 필요한 형태로
  return Response.json({
    recentPosts: posts.map((p: any) => ({
      id: p.id,
      title: p.title,
    })),
    activeUsers: users.map((u: any) => ({
      id: u.id,
      name: u.name,
    })),
    todoSummary: {
      total: todos.length,
      completed: todos.filter((t: any) => t.completed).length,
    },
  });
}
