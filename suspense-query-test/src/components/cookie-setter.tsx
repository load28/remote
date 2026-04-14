"use client";

import { useQueryClient } from "@tanstack/react-query";

export function CookieSetter() {
  const queryClient = useQueryClient();

  const setCookie = () => {
    document.cookie = "access_token=cookie-token-abc123; path=/";
    queryClient.invalidateQueries({ queryKey: ["posts-server-action"] });
  };

  const removeCookie = () => {
    document.cookie =
      "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    queryClient.invalidateQueries({ queryKey: ["posts-server-action"] });
  };

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
      <button
        onClick={setCookie}
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          border: "1px solid #3b82f6",
          backgroundColor: "#eff6ff",
          cursor: "pointer",
        }}
      >
        쿠키 토큰 설정
      </button>
      <button
        onClick={removeCookie}
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          border: "1px solid #ef4444",
          backgroundColor: "#fef2f2",
          cursor: "pointer",
        }}
      >
        쿠키 토큰 제거
      </button>
    </div>
  );
}
