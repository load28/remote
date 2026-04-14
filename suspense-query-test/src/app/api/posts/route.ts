import { cookies } from "next/headers";

/**
 * Route Handler: 토큰을 서버에서 처리하는 프록시
 *
 * 클라이언트는 /api/posts만 호출하면 됨.
 * 토큰은 서버의 쿠키에서 읽어서 외부 API에 전달.
 * → 토큰이 클라이언트에 절대 노출되지 않음.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  console.log("[Route Handler] /api/posts called, token:", token ?? "(없음)");

  const res = await fetch(
    "https://jsonplaceholder.typicode.com/posts?_limit=5",
    {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }
  );

  const data = await res.json();
  return Response.json(data);
}
