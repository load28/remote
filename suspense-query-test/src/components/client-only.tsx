"use client";

import { useState, useEffect, type ReactNode } from "react";

/**
 * SSR을 완전히 건너뛰는 래퍼
 *
 * 서버에서는 children을 렌더링하지 않음 → useSuspenseQuery의 queryFn이 서버에서 실행되지 않음
 * 하이드레이션 후 클라이언트에서만 children을 렌더링
 */
export function ClientOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return fallback ?? null;
  }

  return children;
}
