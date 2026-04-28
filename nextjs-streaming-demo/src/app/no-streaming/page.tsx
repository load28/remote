export const dynamic = "force-dynamic";

async function delay<T>(ms: number, value: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return value;
}

export default async function NoStreamingPage() {
  // Suspense 없이 페이지 컴포넌트 자체가 await — 첫 바이트가 1500ms 후에 나감
  const [fast, slow, medium] = await Promise.all([
    delay(100, "100ms"),
    delay(1500, "1500ms"),
    delay(800, "800ms"),
  ]);

  return (
    <main>
      <h1>/no-streaming — 비교군</h1>
      <p>
        이 페이지는 페이지 컴포넌트 자체가 <code>await Promise.all</code>로 모든
        데이터를 기다립니다. Suspense 경계가 없어서 React는 셸을 먼저 보낼 수
        없고, 첫 바이트(TTFB)가 가장 느린 작업(1500ms) 이후에야 나갑니다.
      </p>
      <ul>
        <li>Fast: {fast}</li>
        <li>Slow: {slow}</li>
        <li>Medium: {medium}</li>
      </ul>
      <p>
        <code>npm run verify:no-streaming</code> 결과와{" "}
        <code>npm run verify:streaming</code>의 첫 청크 도착 시각을 비교해보세요.
      </p>
    </main>
  );
}
