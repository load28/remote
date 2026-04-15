import { verifySession } from "@/lib/dal";

/**
 * Settings Page (서버 컴포넌트)
 *
 * verifySession()이 cache()로 감싸져 있으므로
 * 같은 요청에서 dashboard와 settings 양쪽에서 호출해도 1번만 실행
 */
export default async function SettingsPage() {
  const session = await verifySession();
  console.log("[SettingsPage] 인증 완료, userId:", session.userId);

  return (
    <div>
      <h1>Settings</h1>
      <p style={{ color: "#64748b" }}>인증된 사용자: {session.userId}</p>
    </div>
  );
}
