#!/usr/bin/env node
// 청크별 도착 시각, 누적 바이트, Flight/Suspense 마커를 로깅한다.
// 사용: node scripts/verify.mjs http://localhost:3010/streaming

const url = process.argv[2] ?? "http://localhost:3010/streaming";

const PATTERNS = [
  // SSR HTML — Suspense placeholder 마커
  { name: "Suspense pending marker (<!--$?-->)", pattern: /<!--\$\?-->/g },
  { name: "Suspense end marker (<!--/$-->)", pattern: /<!--\/\$-->/g },
  { name: "hidden swap container (<div hidden id=\"S:...\">)", pattern: /<div hidden id="S:\d+">/g },
  { name: "$RC swap script call", pattern: /\$RC\(/g },
  // RSC Flight payload
  { name: "RSC Flight chunk (__next_f.push)", pattern: /self\.__next_f\.push/g },
  // Flight payload는 __next_f.push 안의 JS 문자열로 들어가서 \"$L6\"처럼 escape됨
  { name: "Flight $L reference (lazy)", pattern: /\\"\$L[0-9a-f]+\\"/g },
];

const t0 = performance.now();
const log = (msg) =>
  console.log(`[+${(performance.now() - t0).toFixed(0).padStart(5)}ms] ${msg}`);

log(`GET ${url}`);

const response = await fetch(url, {
  headers: { "user-agent": "streaming-verifier/1.0" },
});

log(`HTTP ${response.status} ${response.statusText}`);
console.log("\n--- 응답 헤더 (스트리밍 관련) ---");
for (const [k, v] of response.headers) {
  if (
    /transfer-encoding|content-type|content-length|x-accel|x-content|cache/i.test(
      k
    )
  ) {
    console.log(`  ${k}: ${v}`);
  }
}

if (!response.body) {
  console.error("응답 본문 없음");
  process.exit(1);
}

console.log("\n--- 청크 도착 로그 ---");
const decoder = new TextDecoder();
const reader = response.body.getReader();
let chunkIndex = 0;
let totalBytes = 0;
const counts = Object.fromEntries(PATTERNS.map((p) => [p.name, 0]));
const fullBody = [];

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  chunkIndex += 1;
  totalBytes += value.byteLength;
  const text = decoder.decode(value, { stream: true });
  fullBody.push(text);

  // 이번 청크에 포함된 마커
  const hits = [];
  for (const { name, pattern } of PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      counts[name] += m.length;
      hits.push(`${name}×${m.length}`);
    }
  }

  const preview = text.replace(/\s+/g, " ").slice(0, 90);
  log(
    `chunk #${String(chunkIndex).padStart(2)} | +${String(value.byteLength).padStart(
      5
    )}B | total ${String(totalBytes).padStart(6)}B | ${preview}${
      text.length > 90 ? "…" : ""
    }`
  );
  if (hits.length) console.log(`           └─ ${hits.join(", ")}`);
}

log(`완료 — ${chunkIndex} chunks, ${totalBytes} bytes`);

console.log("\n--- 패턴 누적 카운트 ---");
for (const { name } of PATTERNS) {
  console.log(`  ${counts[name]}× ${name}`);
}

// $RC가 가리키는 placeholder→hidden 매핑
const body = fullBody.join("");
const rcCalls = [...body.matchAll(/\$RC\("(B:\d+)",\s*"(S:\d+)"\)/g)].map(
  (m) => `${m[1]}  →  ${m[2]}`
);
if (rcCalls.length) {
  console.log("\n--- $RC swap 매핑 (placeholder → hidden 컨테이너) ---");
  for (const c of rcCalls) console.log(`  ${c}`);
}

// Flight 청크 샘플 보여주기
const flightPushes = [
  ...body.matchAll(/self\.__next_f\.push\(\[1,\s*"((?:[^"\\]|\\.){0,160})/g),
];
if (flightPushes.length) {
  console.log("\n--- Flight payload 샘플 (앞 3개 청크) ---");
  for (const m of flightPushes.slice(0, 3)) {
    console.log(`  ${m[1].replace(/\\n/g, " ")}…`);
  }
}
