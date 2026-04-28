# Next.js Streaming 검증 데모

답변에서 설명한 4개 계층을 직접 확인하기 위한 데모입니다. 각 주장이 어느 도구로
검증되는지가 1:1 매핑되어 있습니다.

## 실행

```bash
cd nextjs-streaming-demo
npm install
npm run dev   # http://localhost:3010
```

다른 터미널에서:

```bash
npm run verify:streaming      # 청크별 도착 시각 + Flight/Suspense 마커
npm run verify:no-streaming   # 비교: 첫 바이트가 1500ms 후에 나옴
npm run verify:raw            # raw TCP 소켓으로 chunked encoding 자체 확인
```

## 주장 ↔ 검증 매핑

| # | 답변에서 한 주장 | 검증 방법 | 어디서 보이는가 |
|---|---|---|---|
| 1 | HTTP/1.1은 `Transfer-Encoding: chunked`로 본문 크기를 모르고도 점진 전송 | `npm run verify:raw` | 응답 헤더에 `Transfer-Encoding: chunked`, 본문에 16진수 길이 + `\r\n` 구분자 |
| 2 | TCP 연결이 열린 채 서버가 `socket.write()`마다 청크가 흐름 | `npm run verify:streaming` | "chunk #N" 로그가 시간차를 두고 찍힘 (100ms / 800ms / 1500ms 부근) |
| 3 | Suspense 경계는 `<!--$?-->` 마커 + fallback HTML로 자리표시자 생성 | verify 결과의 "Suspense pending marker" 카운트 ≥ 1, 첫 청크 응답 본문 검색 | DevTools Response 탭에서 `<!--$?-->` 검색 |
| 4 | resolve 시 `<div hidden id="S:0">` + `<script>$RC("B:0","S:0")` 인라인 swap | verify 결과의 "$RC swap script call", "$RC swap 매핑" 섹션 | B:N → S:N 매핑이 출력됨 |
| 5 | 각 Suspense 경계는 독립적, DOM 순서가 아니라 resolve 순서대로 페인트 | 브라우저에서 `/streaming` 열기 | DOM 순서 Fast→Slow→Medium 인데 페인트는 Fast(100ms)→Medium(800ms)→Slow(1500ms) |
| 6 | RSC Flight payload가 `self.__next_f.push([1, "..."])` 인라인 스크립트로 동봉됨 | verify 결과 "RSC Flight chunk" 카운트 + 샘플 출력 | `0:["$","div",...]` 형태의 Flight 직렬화가 보임 |
| 7 | `$L1`은 "1번 청크가 나중에 도착할 약속" — 비동기 컴포넌트의 lazy 참조 | verify 결과 "Flight $L reference" 카운트 ≥ 1 | Flight payload 안에서 `"$L1"`, `"$L2"` 등 |
| 8 | 첫 청크가 나간 뒤 status code는 200 OK로 굳어짐 — 에러도 200 응답 안에 inline | `curl -i http://localhost:3010/error-after-shell` | 첫 줄 `HTTP/1.1 200 OK` + 본문 끝에 error.tsx UI |
| 9 | 스트리밍 없는 경우 TTFB가 가장 느린 작업까지 지연됨 | `npm run verify:no-streaming` | 첫 청크가 ~1500ms 이후 도착, 한 덩어리로 들어옴 |

## 페이지

### `/streaming`

3개의 비동기 서버 컴포넌트가 각각 별도 `<Suspense>`로 감싸져 있습니다.

- **DOM 순서**: Fast(100ms) → Slow(1500ms) → Medium(800ms)
- **페인트 순서**: Fast → Medium → Slow

Slow가 DOM에서 두 번째 위치에 있어도, 그 위치는 fallback으로 점유되고 그
*아래의* Medium이 먼저 swap-in됩니다. 이게 "각 경계는 독립적인 스트리밍 단위"라는
주장의 핵심입니다.

### `/no-streaming`

페이지 컴포넌트 자체가 `await Promise.all([...])`로 모든 비동기 작업을
기다립니다. Suspense 경계가 없어서 React는 셸을 먼저 보낼 수 없고, 첫 바이트가
1500ms 이후에야 나갑니다.

### `/error-after-shell`

셸이 200 OK + chunked로 즉시 전송된 뒤, 600ms 후 자식 컴포넌트가 throw합니다.
응답 헤더는 이미 클라이언트로 갔기 때문에 status를 5xx로 바꿀 수 없고, 서버는
error.tsx 결과를 같은 스트림에 inline으로 흘려보냅니다.

## 브라우저에서 확인하는 법

1. http://localhost:3010/streaming 열기
2. DevTools → Network → 요청 클릭 → Response 탭
3. 다음 검색:
   - `<!--$?-->` — Suspense 시작 마커 (pending)
   - `<!--/$-->` — Suspense 끝 마커
   - `<div hidden id="S:` — 늦게 도착한 콘텐츠가 들어있는 hidden 컨테이너
   - `$RC(` — placeholder를 hidden 컨테이너 자식들로 swap하는 함수 호출
   - `__next_f.push` — RSC Flight payload 청크
   - `"$L` — Flight payload 안의 lazy 참조
4. Timing 탭에서 `/streaming`의 TTFB는 ~수십 ms, `/no-streaming`은 ~1500ms 임을 비교

## 주의사항

- `next dev`는 dev 모드 오버레이/로깅 때문에 청크 경계가 production보다 더 잘게
  쪼개질 수 있습니다. 가장 정확한 결과를 보려면 `npm run build && npm run start`.
- 리버스 프록시(Nginx) 뒤에서 테스트하면 `proxy_buffering off`나
  `X-Accel-Buffering: no`가 없을 때 청크가 한 덩어리로 합쳐질 수 있습니다. 이
  데모는 Next.js 서버에 직접 붙기 때문에 그 문제는 없습니다.
- HTTP/2/3에서는 chunked encoding이 사용되지 않습니다(프로토콜이 금지). 이 데모는
  `node scripts/raw-http.mjs`로 HTTP/1.1을 강제해 chunked의 wire format을
  보여줍니다.
