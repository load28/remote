# ISR 갱신 플로우 스크린샷

[agent-browser](https://www.npmjs.com/package/agent-browser) CLI로 자동 캡처.
`npm run build && npm start`로 프로덕션 빌드 상태에서 검증했습니다.

## 검증 플로우

| # | 파일 | 설명 | 타임스탬프 |
|---|------|------|------------|
| 1 | `01-site-first-visit.png` | 첫 방문 (빌드 시 SSG prerender) | `23:02:33.141Z` |
| 2 | `02-site-reload-same-timestamp.png` | 리로드 — **캐시 적중** (동일) | `23:02:33.141Z` |
| 3 | `03-admin-page.png` | 관리자 페이지 진입 | - |
| 4 | `04-admin-after-click.png` | **"이 글만 갱신"** 클릭 → `{ revalidated: true, path: "/posts/1" }` | - |
| 5 | `05-site-after-revalidate.png` | site 재방문 — **새 타임스탬프** | `23:04:45.400Z` ✨ |
| 6 | `06-site-reload-new-cache.png` | 리로드 — 새 값으로 재캐시됨 | `23:04:45.400Z` |

## 핵심 증거

- **2 == 1**: ISR 캐시가 유효하여 리로드해도 값 고정
- **5 ≠ 2**: Server Action → Route Handler → `revalidatePath()`로 캐시 무효화됨
- **6 == 5**: 새 렌더링 결과가 다시 캐시됨 (ISR 사이클 재개)

## 재현 방법

```bash
# 빌드 & 시작
cd site && npm run build && npm start &
cd ../admin && npm run build && npm start &

# agent-browser로 자동 캡처
npx agent-browser open http://localhost:3000/posts/1
npx agent-browser screenshot 01-site-first-visit.png
npx agent-browser reload
npx agent-browser screenshot 02-site-reload-same-timestamp.png
npx agent-browser open http://localhost:3001/posts/1
npx agent-browser screenshot 03-admin-page.png
npx agent-browser find text "이 글만 갱신" click
npx agent-browser screenshot 04-admin-after-click.png
npx agent-browser open http://localhost:3000/posts/1
npx agent-browser screenshot 05-site-after-revalidate.png
npx agent-browser reload
npx agent-browser screenshot 06-site-reload-new-cache.png
```
