"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    document.cookie = "access_token=test-token-abc123; path=/";
    console.log("[Login] 토큰 쿠키 설정 완료");
    router.push("/dashboard");
  };

  return (
    <div>
      <h1>Login</h1>
      <p style={{ color: "#64748b" }}>로그인 페이지 (인증 불필요)</p>
      <button
        onClick={handleLogin}
        style={{
          padding: "12px 24px",
          borderRadius: 8,
          border: "none",
          backgroundColor: "#2563eb",
          color: "white",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        로그인
      </button>
    </div>
  );
}
