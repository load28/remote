#!/usr/bin/env node
// raw TCP 소켓으로 GET을 보내고 응답을 그대로 출력한다.
// Transfer-Encoding: chunked 헤더와 16진수 청크 길이 + \r\n 구분자가 보인다.
// 사용: node scripts/raw-http.mjs [path] [port]

import net from "node:net";

const path = process.argv[2] ?? "/streaming";
const port = Number(process.argv[3] ?? 3010);
const host = "localhost";

const t0 = performance.now();
const log = (msg) =>
  process.stdout.write(
    `\n[+${(performance.now() - t0).toFixed(0).padStart(5)}ms] ${msg}\n`
  );

const socket = net.connect(port, host, () => {
  log(`TCP connected — sending GET ${path}`);
  socket.write(
    [
      `GET ${path} HTTP/1.1`,
      `Host: ${host}:${port}`,
      `User-Agent: raw-http/1.0`,
      `Accept: text/html`,
      `Connection: close`,
      ``,
      ``,
    ].join("\r\n")
  );
});

let bytes = 0;
let chunks = 0;
let headersDone = false;

socket.on("data", (buf) => {
  chunks += 1;
  bytes += buf.length;
  const text = buf.toString("utf8");
  log(`socket data #${chunks} (+${buf.length}B, total ${bytes}B)`);

  if (!headersDone) {
    const sep = text.indexOf("\r\n\r\n");
    if (sep !== -1) {
      headersDone = true;
      const headers = text.slice(0, sep);
      console.log("--- HTTP 응답 헤더 ---");
      console.log(headers);
      console.log("--- 본문 시작 (raw, chunked encoding 길이 prefix 포함) ---");
      // 본문은 chunked encoding이라 첫 줄이 16진수 길이여야 함
      const bodyStart = text.slice(sep + 4);
      printChunkPreview(bodyStart);
      return;
    }
  }
  printChunkPreview(text);
});

function printChunkPreview(text) {
  // 처음 80자만 보여줌 — 길이 prefix가 보이도록 raw로 출력
  const escaped = text
    .slice(0, 200)
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n\n");
  console.log(escaped + (text.length > 200 ? "…" : ""));
}

socket.on("end", () => log(`연결 종료 — ${chunks} TCP reads, ${bytes} bytes`));
socket.on("error", (err) => {
  console.error("소켓 에러:", err.message);
  process.exit(1);
});
