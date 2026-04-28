#!/usr/bin/env node
/**
 * Playwright + CDP를 사용해 Next.js 스트리밍을 브라우저 관점에서 검증한다.
 *
 *  - Network.responseReceived / loadingFinished 로 Transfer-Encoding 확인
 *  - Network.dataReceived 이벤트로 청크별 도착 시각 기록
 *  - 100ms 간격으로 스크린샷 → 점진적 렌더 가시화
 *  - DOM에서 <!--$?-->, <div hidden id="S:N"> 마커 직접 검색
 *  - 비디오 녹화
 *
 * 사용: node scripts/browser-verify.mjs <path>
 *      node scripts/browser-verify.mjs /streaming
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const targetPath = process.argv[2] ?? "/streaming";
const baseUrl = process.env.BASE_URL ?? "http://localhost:3010";
const outDir = `screenshots/${targetPath.replaceAll("/", "_") || "_root"}`;
const videoDir = `videos/${targetPath.replaceAll("/", "_") || "_root"}`;
mkdirSync(outDir, { recursive: true });
mkdirSync(videoDir, { recursive: true });

const t0 = performance.now();
const t = () => `+${(performance.now() - t0).toFixed(0).padStart(5)}ms`;
const log = (msg) => console.log(`[${t()}] ${msg}`);

log(`launching chromium for ${baseUrl}${targetPath}`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 900, height: 700 },
  recordVideo: { dir: videoDir, size: { width: 900, height: 700 } },
});
const page = await context.newPage();

// CDP 세션 — 청크별 도착 시각을 잡는 핵심
const cdp = await context.newCDPSession(page);
await cdp.send("Network.enable");

const requests = new Map();
cdp.on("Network.requestWillBeSent", (e) => {
  if (e.request.url.endsWith(targetPath) || e.request.url.endsWith(targetPath + "/")) {
    requests.set(e.requestId, {
      url: e.request.url,
      sentAt: performance.now() - t0,
      chunks: [],
    });
  }
});
cdp.on("Network.responseReceived", (e) => {
  const r = requests.get(e.requestId);
  if (!r) return;
  r.status = e.response.status;
  r.headers = e.response.headers;
  r.firstByteAt = performance.now() - t0;
});
cdp.on("Network.dataReceived", (e) => {
  const r = requests.get(e.requestId);
  if (!r) return;
  r.chunks.push({
    at: performance.now() - t0,
    bytes: e.dataLength,
    encoded: e.encodedDataLength,
  });
});
cdp.on("Network.loadingFinished", (e) => {
  const r = requests.get(e.requestId);
  if (!r) return;
  r.finishedAt = performance.now() - t0;
});

// 첫 바이트가 오자마자 페이지가 commit되면 그 시점부터 CDP 스크린샷으로 캡처한다.
// page.screenshot은 Playwright 페이지 락을 잡으므로 사용하지 않고 CDP를 직접 친다.
const snaps = [];
let stopSnaps = false;
const startNav = performance.now();

async function captureViaCdp() {
  const { data } = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  return Buffer.from(data, "base64");
}

async function snapLoop() {
  while (!stopSnaps) {
    const at = performance.now() - startNav;
    try {
      const [buf, dom] = await Promise.all([
        captureViaCdp(),
        // CDP로 outerHTML 가져오기 — Runtime.evaluate는 페이지 락에 걸리지 않음
        cdp
          .send("Runtime.evaluate", {
            expression: `(() => {
              const text = document.body?.innerText ?? '';
              const html = document.documentElement?.outerHTML ?? '';
              return JSON.stringify({
                pendingMarkers: (html.match(/<!--\\$\\?-->/g) || []).length,
                hiddenContainers: (html.match(/<div hidden id="S:\\d+"/g) || []).length,
                fast: text.includes('Fast (100ms)') && !text.includes('⏳ Fast'),
                medium: text.includes('Medium (800ms)') && !text.includes('⏳ Medium'),
                slow: text.includes('Slow (1500ms)') && !text.includes('⏳ Slow'),
                fastFb: text.includes('⏳ Fast'),
                mediumFb: text.includes('⏳ Medium'),
                slowFb: text.includes('⏳ Slow'),
              });
            })()`,
            returnByValue: true,
          })
          .then((r) => (r.result?.value ? JSON.parse(r.result.value) : null))
          .catch(() => null),
      ]);
      const file = join(outDir, `t${String(at.toFixed(0)).padStart(5, "0")}ms.png`);
      writeFileSync(file, buf);
      snaps.push({ at, file, visible: dom });
      log(
        `snap @+${at.toFixed(0).padStart(5)}ms — pending:${dom?.pendingMarkers ?? "?"} hidden:${
          dom?.hiddenContainers ?? "?"
        } fast:${dom?.fast ? "Y" : dom?.fastFb ? "fb" : "-"} med:${
          dom?.medium ? "Y" : dom?.mediumFb ? "fb" : "-"
        } slow:${dom?.slow ? "Y" : dom?.slowFb ? "fb" : "-"}`
      );
    } catch (err) {
      log(`snap error: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 80));
  }
}

// commit이면 첫 바이트 시점에 즉시 return → 그때부터 캡처 시작
const navPromise = page
  .goto(baseUrl + targetPath, { waitUntil: "commit", timeout: 30000 })
  .catch((e) => log(`goto error: ${e.message}`));
await navPromise;
log(`navigation committed — capture loop 시작`);
const snapPromise = snapLoop();

// 모든 청크가 도착할 때까지 기다림
await new Promise((r) => setTimeout(r, 2200));
stopSnaps = true;
await snapPromise;

// 최종 DOM 상태
const final = await page.evaluate(() => ({
  text: document.body.innerText,
  pendingMarkers: (document.documentElement.outerHTML.match(/<!--\$\?-->/g) || []).length,
  hiddenContainers: (document.documentElement.outerHTML.match(/<div hidden id="S:\d+"/g) || [])
    .length,
}));

log(
  `최종 DOM — pendingMarkers:${final.pendingMarkers}, hiddenContainers(swap 후 남은 것):${final.hiddenContainers}`
);

const videoPath = await page.video()?.path();
await context.close();
await browser.close();

// 결과 요약
const req = [...requests.values()][0];
const networkLog = req
  ? {
      url: req.url,
      status: req.status,
      transferEncoding: req.headers?.["transfer-encoding"],
      contentLength: req.headers?.["content-length"] ?? "(none — chunked)",
      contentType: req.headers?.["content-type"],
      firstByteAt: req.firstByteAt?.toFixed(0) + "ms",
      finishedAt: req.finishedAt?.toFixed(0) + "ms",
      totalChunks: req.chunks.length,
      chunks: req.chunks.map((c) => ({ at: +c.at.toFixed(0), bytes: c.bytes })),
    }
  : null;

console.log("\n=== CDP 네트워크 요약 ===");
console.log(JSON.stringify(networkLog, null, 2));

// 첫 등장 시점 추출
const firstSeen = {};
for (const k of ["fast", "medium", "slow"]) {
  const found = snaps.find((s) => s.visible?.[k]);
  firstSeen[k] = found ? `+${found.at.toFixed(0)}ms` : "not seen";
}
// 마지막으로 fallback이 사라진 시점도 기록
const fallbackGone = {};
for (const [k, fbKey] of [
  ["fast", "fastFb"],
  ["medium", "mediumFb"],
  ["slow", "slowFb"],
]) {
  // 첫 캡처에서 fb였던 컴포넌트가 처음으로 fb가 아니게 된 시점
  const wasFb = snaps[0]?.visible?.[fbKey];
  if (wasFb) {
    const idx = snaps.findIndex((s) => !s.visible?.[fbKey]);
    fallbackGone[k] = idx >= 0 ? `+${snaps[idx].at.toFixed(0)}ms` : "still fb";
  }
}
console.log("\n=== 컴포넌트 첫 가시 시점 (resolve된 콘텐츠가 보인 시각) ===");
console.log(JSON.stringify(firstSeen, null, 2));
console.log("\n=== Fallback이 사라진 시점 (placeholder swap 완료) ===");
console.log(JSON.stringify(fallbackGone, null, 2));

writeFileSync(
  join(outDir, "summary.json"),
  JSON.stringify(
    { networkLog, firstSeen, snapshots: snaps.map((s) => ({ at: s.at, visible: s.visible })) },
    null,
    2
  )
);
console.log(`\n비디오: ${videoPath}`);
console.log(`스크린샷: ${outDir}/`);
console.log(`요약: ${outDir}/summary.json`);
