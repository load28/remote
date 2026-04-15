import { cookies } from "next/headers";

/**
 * Route Handler: BFF(Backend for Frontend) 역할
 *
 * - 클라이언트는 /api/posts만 호출하면 됨 (토큰 몰라도 됨)
 * - 서버가 httpOnly 쿠키에서 토큰을 읽어서 외부 API에 전달
 * - 토큰이 클라이언트 JS에 절대 노출되지 않음
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ?? "10";

  // 외부 API 호출 — 토큰은 여기서만 사용됨
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/posts?_limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    return Response.json(
      { error: "External API error" },
      { status: res.status }
    );
  }

  return Response.json(await res.json());
}
