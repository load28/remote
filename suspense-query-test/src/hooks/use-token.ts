"use client";

import { useSyncExternalStore } from "react";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * SSR-safe 토큰 훅
 * - 서버: getServerSnapshot → null 반환
 * - 클라이언트: localStorage에서 토큰 반환
 */
export function useToken() {
  return useSyncExternalStore(
    subscribe,
    getToken,       // 클라이언트 스냅샷
    () => null       // 서버 스냅샷 (SSR 시 null)
  );
}
