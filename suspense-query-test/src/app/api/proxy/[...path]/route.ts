import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const API_BASE = process.env.API_BASE_URL ?? "https://jsonplaceholder.typicode.com";

/**
 * Catch-all 프록시 Route Handler
 *
 * /api/proxy/posts        → https://external-api.com/posts
 * /api/proxy/users/1      → https://external-api.com/users/1
 * /api/proxy/comments?postId=1 → https://external-api.com/comments?postId=1
 *
 * 모든 요청에 자동으로 Authorization 헤더를 붙여줌
 * Route Handler를 엔드포인트마다 만들 필요 없음
 */
async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 경로 조합: /api/proxy/posts/1 → /posts/1
  const targetPath = path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${API_BASE}/${targetPath}${searchParams ? `?${searchParams}` : ""}`;

  const res = await fetch(url, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    // GET/HEAD는 body 없음
    ...(request.method !== "GET" &&
      request.method !== "HEAD" && {
        body: await request.text(),
      }),
  });

  return new Response(res.body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
