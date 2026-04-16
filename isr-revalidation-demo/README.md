# ISR 갱신 트리거 데모

두 개의 Next.js 앱으로 구성된 최소 예제:

- **site** (port 3000): ISR로 캐싱된 페이지 + 갱신용 Route Handler
- **admin** (port 3001): site의 Route Handler를 호출해 캐시를 갱신시키는 관리자 앱

```
┌──────────────────────┐          ┌──────────────────────────┐
│  admin (3001)        │          │  site (3000)             │
│  ───────────         │          │  ───────────             │
│  버튼 클릭            │          │  /posts/[id]  (ISR)       │
│    ↓                 │          │      ↑                    │
│  Server Action       │──POST───▶│  /api/revalidate          │
│  (시크릿 포함)        │          │  → revalidatePath()       │
└──────────────────────┘          └──────────────────────────┘
```

## 실행

### 1. 사이트 앱

```bash
cd site
cp .env.local.example .env.local
npm install
npm run dev
```

→ http://localhost:3000

### 2. 관리자 앱 (새 터미널)

```bash
cd admin
cp .env.local.example .env.local
npm install
npm run dev
```

→ http://localhost:3001

## 동작 확인

1. http://localhost:3000/posts/1 접속 → 하단 "렌더링 시각" 기억
2. 새로고침해도 시각이 바뀌지 않음 (ISR 캐시 적중)
3. http://localhost:3001/posts/1 접속 → **"이 글만 갱신"** 버튼 클릭
4. 다시 http://localhost:3000/posts/1 새로고침 → **시각이 갱신됨** ✨

## 핵심 포인트

### site/app/api/revalidate/route.ts
외부에서 호출 가능한 Route Handler. 시크릿 검증 + `revalidatePath` / `revalidateTag` 실행.

### admin/app/actions.ts (Server Action)
`admin` 서버가 내부에서 `site`의 Route Handler를 호출. 시크릿이 브라우저로 노출되지 않음.

### 두 가지 호출 방식 비교

| 방식 | CORS | 시크릿 노출 | 추천 |
|------|------|------------|------|
| Server Action → site API | 불필요 | ❌ 서버에만 존재 | ✅ |
| 브라우저 fetch → site API | 필요 | ⚠️ 클라이언트 번들에 포함 | 🚫 |

관리자 앱 UI에서 두 방식을 모두 테스트할 수 있습니다.

### CORS 설정 위치
`site/lib/cors.ts`에 허용 Origin 화이트리스트 관리.
`site/app/api/revalidate/route.ts`의 `OPTIONS` / `POST` 응답에 CORS 헤더 포함.

## 확장 아이디어

- 외부 CMS 웹훅을 `/api/revalidate`에 직접 등록 (관리자 앱 없이)
- HMAC 서명 검증 추가 (`x-webhook-signature`)
- `revalidateTag('posts')`로 여러 페이지를 한 번에 갱신
- 권한 체크를 세션 기반으로 (Server Action 안에서)
