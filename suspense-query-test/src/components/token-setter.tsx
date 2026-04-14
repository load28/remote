"use client";

import { useQueryClient } from "@tanstack/react-query";

export function TokenSetter() {
  const queryClient = useQueryClient();

  const setToken = () => {
    localStorage.setItem("access_token", "test-token-12345");
    // storage 이벤트는 같은 탭에서 안 나가므로 수동 dispatch
    window.dispatchEvent(new StorageEvent("storage"));
    // 토큰이 바뀌었으므로 관련 쿼리 무효화
    queryClient.invalidateQueries({ queryKey: ["posts-fixed"] });
  };

  const removeToken = () => {
    localStorage.removeItem("access_token");
    window.dispatchEvent(new StorageEvent("storage"));
    queryClient.invalidateQueries({ queryKey: ["posts-fixed"] });
  };

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
      <button
        onClick={setToken}
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          border: "1px solid #22c55e",
          backgroundColor: "#f0fdf4",
          cursor: "pointer",
        }}
      >
        토큰 설정
      </button>
      <button
        onClick={removeToken}
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          border: "1px solid #ef4444",
          backgroundColor: "#fef2f2",
          cursor: "pointer",
        }}
      >
        토큰 제거
      </button>
    </div>
  );
}
