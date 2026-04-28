# 브라우저 기반 검증 결과 (Playwright + CDP)

`scripts/browser-verify.mjs`가 헤드리스 Chromium을 띄우고 CDP(Chrome DevTools
Protocol)로 다음을 캡처합니다.

- **Network.responseReceived / dataReceived**: 청크별 도착 시각, 헤더, 바이트
- **Page.captureScreenshot**: 80ms 간격 PNG (페이지 락 우회)
- **Runtime.evaluate**: DOM에서 `<!--$?-->`, `<div hidden id="S:N">` 마커 카운트
- **page.video()**: 브라우저 내부 프레임 녹화 (스레드 블로킹 없음)

production 빌드(`next build && next start`) 기준으로 측정했습니다.

## /streaming — Suspense 경계 3개

### CDP 네트워크 요약 (실측)

```json
{
  "url": "http://localhost:3010/streaming",
  "status": 200,
  "transferEncoding": "chunked",
  "contentLength": "(none — chunked)",
  "firstByteAt": "140ms",
  "finishedAt": "1638ms",
  "totalChunks": 5,
  "chunks": [
    { "at": 152,  "bytes": 9655 },   // 셸 + RSC 초기 + Fast swap
    { "at": 224,  "bytes": 1565 },
    { "at": 919,  "bytes": 732  },   // Medium swap (~800ms 지점)
    { "at": 1633, "bytes": 734  },   // Slow swap (~1500ms 지점)
    { "at": 1633, "bytes": 14   }    // 0-length 종료
  ]
}
```

청크 도착 간격:
- 첫 청크(셸): 140ms 후
- 2번째 그룹(Medium): 919ms — 첫 청크 대비 +779ms (Medium 800ms 지연 ✓)
- 3번째 그룹(Slow): 1633ms — Medium 대비 +714ms, 첫 청크 대비 +1493ms (Slow 1500ms ✓)

### 컴포넌트 가시성 변화 (DOM 마커 + 텍스트)

| 시각 | pendingMarkers | Fast | Slow (DOM 2번) | Medium (DOM 3번) |
|------|---|---|---|---|
| +26ms  | 3 | fb | fb | fb |
| +426ms | 2 | **Y** | fb | fb |
| +863ms | 1 | Y | fb | **Y** ← DOM 순서를 건너뛰고 swap |
| +1523ms | 0 | Y | **Y** | Y |

### 결정적 증명 — DOM 순서 ≠ 페인트 순서

`screenshots/_streaming/t00863ms.png`에서 화면 상단부터:

1. Fast (초록 박스, resolved)
2. **Slow** — 여전히 점선 fallback
3. **Medium** — 노란 박스로 swap 완료

Slow가 DOM에서는 두 번째 위치인데, 그 *아래*의 Medium이 먼저 채워져 있습니다.
Suspense 경계가 독립적인 스트리밍 단위라는 증명입니다.

`videos/_streaming/streaming.webm`에서 영상으로 같은 흐름을 재생할 수 있습니다.

## /no-streaming — 비교군

```json
{
  "firstByteAt": "1622ms",
  "totalChunks": 2,
  "chunks": [
    { "at": 1633, "bytes": ... },
    { "at": 1633, "bytes": ... }
  ]
}
```

- TTFB가 **1622ms** (가장 느린 1500ms 작업이 끝난 직후)
- 모든 청크가 같은 시각에 한 번에 도착
- 첫 스크린샷이 ~1.5초 시점 — 그 전에는 화면에 아무것도 없음

`/streaming`과 비교하면 **셸 도착이 11배 빠름** (140ms vs 1622ms).

## /error-after-shell — 상태 코드 잠김

```json
{
  "status": 200,
  "firstByteAt": "135ms",
  "totalChunks": 3,
  "chunks": [
    { "at": 145,  "bytes": ... },   // 셸 + 200 OK 헤더 → 잠김
    { "at": 712,  "bytes": ... },   // 600ms 후 throw → error.tsx 결과
    { "at": 728,  "bytes": ... }
  ]
}
```

응답 코드가 **200**입니다. 헤더는 첫 청크와 함께 135ms에 이미 전송됐고, 600ms
시점의 throw는 응답 본문 안에 error.tsx의 출력으로 inline됩니다. 5xx로 바뀔 수
없습니다.

## 산출물

```
scripts/browser-verify.mjs              검증 스크립트
screenshots/_streaming/                  21장의 80ms 간격 PNG + summary.json
screenshots/_no-streaming/               21장 (전부 동일한 완성된 상태)
screenshots/_error-after-shell/          23장 + 200 OK 응답 본문 캡처
videos/_streaming/streaming.webm         3개 박스가 차례로 채워지는 영상
videos/_no-streaming/no-streaming.webm   1.5초 빈 화면 후 즉시 완성
videos/_error-after-shell/error-after-shell.webm
```

## 재현

```bash
npm run build && npm run start &
# 다른 터미널
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
  node scripts/browser-verify.mjs /streaming
```
