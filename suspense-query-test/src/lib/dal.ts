import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * DAL: 세션 검증
 *
 * cache()로 감싸서 같은 렌더링에서 여러 번 호출해도 1번만 실행
 * 서버 컴포넌트, Route Handler에서만 호출 가능 (server-only)
 */
export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  console.log("[DAL] verifySession 호출, 토큰:", token ? "***존재***" : "(없음)");

  if (!token) {
    console.log("[DAL] 토큰 없음 → /login 리다이렉트");
    redirect("/login");
  }

  // 실제 엔터프라이즈: JWT 디코딩, 만료 확인, DB 조회 등
  return { userId: "user-1", token };
});
