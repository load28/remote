import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function delay<T>(ms: number, value: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return value;
}

async function FastBlock() {
  const t0 = Date.now();
  const data = await delay(100, "100ms 만에 resolve된 빠른 컴포넌트");
  return (
    <Block label="Fast (100ms)" color="#0f9d58" content={data} elapsed={Date.now() - t0} />
  );
}

async function SlowBlock() {
  const t0 = Date.now();
  const data = await delay(1500, "1500ms 걸린 가장 느린 컴포넌트");
  return (
    <Block label="Slow (1500ms)" color="#db4437" content={data} elapsed={Date.now() - t0} />
  );
}

async function MediumBlock() {
  const t0 = Date.now();
  const data = await delay(800, "800ms 걸린 중간 속도 컴포넌트");
  return (
    <Block label="Medium (800ms)" color="#f4b400" content={data} elapsed={Date.now() - t0} />
  );
}

function Block({
  label,
  color,
  content,
  elapsed,
}: {
  label: string;
  color: string;
  content: string;
  elapsed: number;
}) {
  return (
    <div
      style={{
        border: `2px solid ${color}`,
        padding: 16,
        margin: "12px 0",
        borderRadius: 8,
      }}
    >
      <strong style={{ color }}>{label}</strong> — resolved at {elapsed}ms
      <p style={{ margin: "8px 0 0" }}>{content}</p>
    </div>
  );
}

function Fallback({ label }: { label: string }) {
  return (
    <div
      style={{
        border: "2px dashed #999",
        padding: 16,
        margin: "12px 0",
        borderRadius: 8,
        color: "#666",
      }}
    >
      ⏳ {label} fallback (이 자리에 <code>{"<!--$?-->"}</code> 마커가 박힘)
    </div>
  );
}

const tStart = Date.now();

export default function StreamingPage() {
  // 페이지가 평가되는 시점(=서버가 첫 청크를 만들 시점) 기록
  const renderedAt = Date.now() - tStart;
  return (
    <main>
      <h1>/streaming — Suspense + RSC Flight</h1>
      <p>
        셸은 첫 청크에 즉시 전송됩니다. 이 줄이 보이는 시점 = 서버가{" "}
        <code>chunked</code> 응답을 시작한 시점입니다. (서버 모듈 로드 후{" "}
        {renderedAt}ms)
      </p>

      <p>
        DOM 순서: <strong>Fast → Slow → Medium</strong>
        <br />
        예상 페인트 순서: <strong>Fast (100ms) → Medium (800ms) → Slow (1500ms)</strong>
        <br />→ DOM 순서와 무관하게 resolve된 순서대로 swap됩니다.
      </p>

      <Suspense fallback={<Fallback label="Fast" />}>
        <FastBlock />
      </Suspense>

      <Suspense fallback={<Fallback label="Slow (DOM 위치는 두 번째지만 가장 늦게 도착)" />}>
        <SlowBlock />
      </Suspense>

      <Suspense fallback={<Fallback label="Medium" />}>
        <MediumBlock />
      </Suspense>

      <hr style={{ margin: "32px 0" }} />
      <p>
        브라우저에서 Network → Response를 보면 응답 끝부분에 <code>$RC(&quot;B:0&quot;,
        &quot;S:0&quot;)</code>{" "}
        형태의 인라인 스크립트가 청크별로 추가되어 자리표시자를 swap합니다.
      </p>
    </main>
  );
}
