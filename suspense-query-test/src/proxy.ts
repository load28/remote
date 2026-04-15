import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api/proxy/* 요청에만 토큰 헤더 주입 (평가 없음, 주입만)
  if (pathname.startsWith("/api/proxy")) {
    const token = request.cookies.get("access_token")?.value;

    const requestHeaders = new Headers(request.headers);
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }

    console.log(`[Proxy] ${pathname} → Authorization: ${token ? "Bearer ***" : "(없음)"}`);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/proxy/:path*"],
};
