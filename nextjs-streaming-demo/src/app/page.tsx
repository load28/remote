import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Next.js Streaming 검증 데모</h1>
      <p>
        이 데모는 답변에서 설명한 4개 계층(HTTP chunked, Web Streams, Suspense
        placeholder swap, RSC Flight payload)을 직접 확인하기 위한 것입니다.
      </p>

      <h2>페이지</h2>
      <ul>
        <li>
          <Link href="/streaming">/streaming</Link> — 3개의 Suspense 경계, DOM
          순서와 다른 resolve 순서 (100ms / 1500ms / 800ms)
        </li>
        <li>
          <Link href="/no-streaming">/no-streaming</Link> — 같은 데이터를{" "}
          <code>await Promise.all</code>로 묶어 스트리밍을 막음
        </li>
        <li>
          <Link href="/error-after-shell">/error-after-shell</Link> — 셸이 이미
          전송된 뒤 발생한 에러는 200 OK로 굳어진 응답에 inline 처리됨
        </li>
      </ul>

      <h2>커맨드라인 검증</h2>
      <pre>{`# 청크별 도착 시각 + Flight 마커 추출
npm run verify:streaming

# 비교 (한 번에 큰 덩어리로 도착)
npm run verify:no-streaming

# raw HTTP — Transfer-Encoding: chunked 헤더와 \\r\\n 청크 길이 확인
npm run verify:raw`}</pre>

      <h2>브라우저에서 보는 법</h2>
      <ol>
        <li>DevTools → Network → 요청 선택 → Response 탭에서 raw HTML 확인</li>
        <li>
          <code>{"<!--$?-->"}</code>, <code>{"<!--/$-->"}</code>,{" "}
          <code>$RC</code>, <code>__next_f.push</code>, <code>$L1</code> 검색
        </li>
        <li>Timing 탭에서 TTFB와 Content Download 시간 비교</li>
      </ol>
    </main>
  );
}
