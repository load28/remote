import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: 모든 요청에 대해 토큰 검증/갱신
 *
 * 엔터프라이즈에서는 여기서:
 * - access_token 만료 확인
 * - refresh_token으로 갱신
 * - 갱신된 토큰을 쿠키에 다시 세팅
 * - 토큰 없으면 로그인 페이지로 리다이렉트
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  // 로그인 페이지는 토큰 검증 스킵
  if (request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // API 라우트는 각 핸들러가 처리
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 토큰 없으면 로그인으로
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // TODO: 실제 엔터프라이즈에서는 여기서
  // - JWT 만료 확인 (jose 등으로 디코딩)
  // - 만료됐으면 refresh_token으로 갱신 요청
  // - 갱신 성공하면 Set-Cookie로 새 토큰 세팅
  // - 갱신 실패하면 로그인으로 리다이렉트

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
