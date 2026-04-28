import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function ThrowAfterShell(): Promise<React.ReactNode> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  throw new Error(
    "셸이 이미 200 OK로 흘러나간 뒤에 던져진 에러 — 응답 코드를 5xx로 바꿀 수 없음"
  );
}

export default function ErrorAfterShellPage() {
  return (
    <main>
      <h1>/error-after-shell</h1>
      <p>
        이 페이지의 셸은 즉시 200 OK + <code>Transfer-Encoding: chunked</code>로
        전송됩니다. 600ms 뒤 자식 컴포넌트가 throw하지만, 헤더가 이미 클라이언트로
        간 뒤이므로 서버는 상태 코드를 변경할 수 없고{" "}
        <strong>응답 본문 안에서</strong> error.tsx의 결과를 흘려보냅니다.
      </p>
      <p>
        터미널에서: <code>curl -i http://localhost:3010/error-after-shell</code>
        <br />→ 첫 줄에 <code>HTTP/1.1 200 OK</code>가 찍히고, 본문 끝에 에러
        UI가 도착합니다.
      </p>
      <Suspense fallback={<p>⏳ 600ms 뒤 throw 예정…</p>}>
        <ThrowAfterShell />
      </Suspense>
    </main>
  );
}
