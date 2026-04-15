"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    // httpOnly 쿠키는 서버에서 세팅해야 하지만, 테스트 편의상 클라이언트에서 세팅
    document.cookie = "access_token=enterprise-token-abc123; path=/";
    router.push("/enterprise");
  };

  return (
    <main style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 16px" }}>
      <h1>Login</h1>
      <button
        onClick={handleLogin}
        style={{
          padding: "12px 24px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#2563eb",
          color: "white",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        로그인 (테스트 토큰 발급)
      </button>
    </main>
  );
}
