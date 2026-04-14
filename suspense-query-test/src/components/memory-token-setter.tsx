"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  setMemoryToken,
  clearMemoryToken,
  getMemoryToken,
} from "@/components/posts-with-memory-token";

export function MemoryTokenSetter() {
  const queryClient = useQueryClient();

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
      <button
        onClick={() => {
          setMemoryToken("memory-token-xyz789");
          queryClient.invalidateQueries({ queryKey: ["posts-memory"] });
        }}
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          border: "1px solid #f59e0b",
          backgroundColor: "#fffbeb",
          cursor: "pointer",
        }}
      >
        메모리 토큰 설정
      </button>
      <button
        onClick={() => {
          clearMemoryToken();
          queryClient.invalidateQueries({ queryKey: ["posts-memory"] });
        }}
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          border: "1px solid #ef4444",
          backgroundColor: "#fef2f2",
          cursor: "pointer",
        }}
      >
        메모리 토큰 제거
      </button>
    </div>
  );
}
