# 칸반 앱 프로젝트 — Phase 1, Step 1

> 모노레포 골격 (Bun + Turborepo + Biome + tRPC v11)

---

## 0. 프로젝트 전체 의사결정 요약

### 0.1 스택 결정

| 영역            | 선택                            | 비고                                     |
| --------------- | ------------------------------- | ---------------------------------------- |
| 모바일          | RN 껍데기 + WebView             | 대부분 기능은 웹으로, 앱은 껍데기        |
| 웹 프레임워크   | TanStack Start                  | v1.0 (2026년 3월 정식). client-first SSR |
| BFF 프레임워크  | Hono (호스트 셸)                | tRPC를 마운트하는 HTTP 호스트 역할       |
| RPC 레이어      | **tRPC v11**                    | 모든 BFF 로직을 procedure로 작성         |
| OpenAPI 생성    | **@trpc/openapi (공식, alpha)** | 라우터 변경 없이 정적 분석으로 생성      |
| 데이터 검증     | Zod                             | tRPC procedure 입출력 검증               |
| DB              | SQLite                          | 로컬 개발 친화                           |
| ORM             | Drizzle                         | TS 친화적, schema-first                  |
| SQLite 드라이버 | `bun:sqlite`                    | Bun 내장, 가장 빠름                      |
| 패키지 매니저   | Bun                             | install 4-5x 빠름                        |
| 런타임          | Bun (옵션 A: Bun 올인)          | BFF/스크립트 모두 Bun                    |
| 모노레포 도구   | Turborepo                       | 캐시/태스크 그래프                       |
| Lint/Format     | Biome                           | ESLint+Prettier 통합 대체                |

### 0.2 도메인 결정

| 영역         | 선택                                                           |
| ------------ | -------------------------------------------------------------- |
| 사용자 모델  | 멀티유저 (인증/권한 제대로)                                    |
| 도메인 범위  | 풍부 (보드/리스트/카드 + 라벨, 기한, 코멘트, 첨부, 체크리스트) |
| 인증 방식    | 직접 구현 (세션 ID → 액세스 토큰)                              |
| 세션 ID 저장 | SHA-256 해시                                                   |
| 엔티티 PK    | UUID v7 (시간 정렬 + 추측 불가)                                |

### 0.3 인증 모델

```
1. 로그인 흐름

  RN WebView                  TanStack Start          Hono BFF
      │                            │                      │
      │  POST /trpc/auth.login                             │
      │ ─────────────────────────────────────────────────► │
      │                            │                      │
      │  Set-Cookie: sid=xxx (HttpOnly, Secure, SameSite) │
      │ ◄───────────────────────────────────────────────── │
      │                                                    │
      │  쿠키는 WebView 내부에 저장됨

2. 이후 API 호출 (SSR 경유)

      │  GET /board/123                                    │
      │  Cookie: sid=xxx                                   │
      │ ─────────────────►        │                       │
      │                            │  쿠키에서 sid 추출 → │
      │                            │  서버 측에서 access_token │
      │                            │  생성 또는 캐시된 것 사용 │
      │                            │                       │
      │                            │  POST /trpc/board.getById │
      │                            │  Authorization: Bearer ... │
      │                            │ ────────────────────► │
      │                            │ ◄──────────────────── │
      │  ◄────────────────────────                         │
```

**자격 증명 분리**

| 항목      | 세션 ID (sid)             | 액세스 토큰                     |
| --------- | ------------------------- | ------------------------------- |
| 어디 저장 | 쿠키 (WebView/브라우저)   | 메모리/짧은 캐시 (SSR 서버)     |
| 수명      | 길다 (예: 7일~30일)       | 짧다 (예: 5~15분)               |
| 형태      | 불투명한 랜덤 문자열      | JWT (서명된 자격)               |
| 폐기      | DB에서 삭제 → 즉시 무효화 | 만료 대기 (또는 jti 블랙리스트) |
| 누가 검증 | DB 조회 (해시 비교)       | 서명만 검증 (DB 불필요)         |

**보안 결정 사항**

- 세션 ID는 클라이언트에만 평문, DB에는 SHA-256 해시 저장
- 쿠키: `HttpOnly`, `Secure`, `SameSite=Lax`
- CSRF 방어: 상태 변경 procedure(mutation)에 별도 토큰 또는 Origin 검증
- WebView ↔ 네이티브 인증 동기화는 Phase 3에서 처리

---

## 1. 전체 아키텍처

```
┌─────────────────────────────────────┐
│  React Native 앱 (껍데기)            │
│  ├─ react-native-webview            │
│  └─ 네이티브 브릿지 (Push, Auth 등) │
└──────────────┬──────────────────────┘
               │ HTTPS (tRPC client over fetch)
┌──────────────▼──────────────────────┐
│  TanStack Start (웹 앱 본체)         │
│  ├─ SSR 라우트 (초기 진입)           │
│  ├─ SPA 라우트 (웹뷰 내부 네비)      │
│  └─ tRPC client (createTRPCClient)  │
└──────────────┬──────────────────────┘
               │ HTTP (tRPC over fetch)
┌──────────────▼──────────────────────┐
│  Hono BFF (Bun 런타임)              │
│  └─ @hono/trpc-server 어댑터        │
│         │                           │
│  ┌──────▼─────────────────┐         │
│  │ tRPC v11 router        │         │
│  │  ├─ auth.*             │         │
│  │  ├─ workspace.*        │         │
│  │  ├─ board.*            │         │
│  │  ├─ list.*             │         │
│  │  ├─ card.*             │         │
│  │  └─ ...                │         │
│  │                        │         │
│  │ + Drizzle ORM          │         │
│  └────────────────────────┘         │
└──────────────┬──────────────────────┘
               │
        ┌──────▼──────┐
        │   SQLite    │
        └─────────────┘
```

### tRPC 올인의 의미

- **모든 BFF 로직은 tRPC procedure로 작성**한다.
- Hono는 단순한 HTTP 호스트 셸 역할 (`@hono/trpc-server` 미들웨어가 모든 `/trpc/*` 요청을 tRPC 라우터로 위임).
- 외부 노출이 필요한 procedure에는 `.meta({ openapi: { method, path } })` 추가하여 OpenAPI에 포함.
- OpenAPI를 보지 않는 클라이언트(웹/RN)는 tRPC 클라이언트(`@trpc/client`)로 호출 — 타입 안전성 자동.
- OpenAPI를 보는 외부 클라이언트(예: 네이티브 모듈, 외부 파트너)는 `@trpc/openapi`가 생성한 OpenAPI spec을 사용.

### Hono를 호스트로 두는 이유 (왜 standalone tRPC가 아닌가)

- 헬스체크, 메트릭, 정적 파일 서빙 등 **tRPC 외 라우트가 필요한 케이스**가 거의 항상 생긴다.
- Bun 런타임에서 fetch 기반 핸들러를 가장 깔끔하게 다루는 게 Hono.
- tRPC standalone adapter를 써도 되지만, 그 경우 위와 같은 부가 기능 추가 시 결국 Hono 같은 걸 다시 도입하게 됨.

---

## 2. 모노레포 구조

```
kanban/
├── apps/
│   ├── api/                 # Hono BFF 호스트 셸 (다음 Step)
│   ├── web/                 # TanStack Start 웹 앱 (Phase 2)
│   └── mobile/              # React Native 껍데기 (Phase 3)
│
├── packages/
│   ├── db/                  # Drizzle 스키마 + 마이그레이션 + 클라이언트
│   ├── trpc/                # tRPC 라우터 + procedure 정의 (NEW)
│   ├── domain/              # 도메인 타입, Zod 스키마, 비즈니스 규칙
│   ├── ui/                  # 공유 UI 컴포넌트 (웹 전용)
│   ├── config-typescript/   # 공유 tsconfig
│   └── config-biome/        # 공유 Biome 설정
│
├── package.json
├── turbo.json
├── biome.json
├── bunfig.toml
├── .gitignore
└── .nvmrc
```

### tRPC 도입으로 변경된 점

**`packages/api-contract` 폐기**

- 이전 계획: Hono RPC 타입을 export하는 별도 패키지.
- 변경 이유: tRPC가 동일 역할을 더 풍부하게 수행 (procedure 단위 타입, 미들웨어, 검증 통합). 별도 contract 패키지 불필요.

**`packages/trpc` 신설**

- 모든 tRPC 라우터/procedure를 보관.
- `apps/api`는 이 패키지를 import해서 Hono에 마운트만 한다.
- 클라이언트(`apps/web`, `apps/mobile`)는 이 패키지의 **타입만** import (`type AppRouter`).
- 런타임 코드는 클라이언트 번들에 포함되지 않아야 함 → 패키지 내부에서 server-only / shared 분리 주의.

**`packages/db` ↔ `packages/trpc` 의존 관계**

- `packages/trpc`는 `packages/db`에 의존 (procedure 안에서 DB 호출).
- `packages/db`는 `bun:sqlite`를 직접 사용 → 클라이언트 번들에 들어가면 안 됨.
- 따라서 `packages/trpc`는 두 가지 export 경로를 가진다:
  - `@kanban/trpc/server` — 라우터 정의 + 런타임 (서버 전용)
  - `@kanban/trpc/types` — `AppRouter` 타입만 (클라이언트용)

### 패키지 의존 그래프

```
apps/api ────────► packages/trpc/server ────► packages/db
                                          └─► packages/domain

apps/web ────────► packages/trpc/types  (타입만)
         ├──────► packages/domain (Zod 스키마, 도메인 타입)
         └──────► packages/ui

packages/* ──────► packages/config-typescript
                   packages/config-biome
```

---

## 3. 도메인 모델 (ERD)

```
User ──────────────┐
  │                │ owner
  │ member         │
  ▼                ▼
WorkspaceMember ─→ Workspace
                     │
                     ▼
                   Board
                     │
                     ▼
                   List (column)
                     │
                     ▼
                   Card ──→ Label (M:N)
                     │  ──→ Assignee (User, M:N)
                     ├──→ Comment
                     ├──→ Attachment
                     └──→ Checklist
                            │
                            ▼
                          ChecklistItem
```

### 학습 포인트가 되는 결정들

**(1) 정렬 방식: `position` 컬럼**

- **`position` (float)**: `1.0, 2.0, 3.0` → 사이에 끼우면 `1.5`. 간단하지만 부동소수점 정밀도 한계.
- **Linked List (`prev_id`, `next_id`)**: 정확하지만 N개 카드 옮기면 N번 업데이트.
- **Lexorank (Jira 방식)**: `"aaa", "aam", "aba"` 같은 문자열 키. 거의 무한 분할 가능.

→ **Phase 1에서는 `position` (정수 + rebalance)** 로 시작 → 한계 체감 후 Lexorank로 마이그레이션 (학습 가치 우선).

**(2) 멀티테넌시: Workspace를 1급 시민으로**
처음부터 Workspace 개념을 둔다. 이유:

- 권한 모델이 깔끔해짐 (`workspace_member.role`이 권한의 최상위)
- 모든 쿼리에 `WHERE workspace_id = ?` 강제 → SQL 인젝션/권한 누수 방지의 기본
- tRPC 미들웨어로 workspace 권한 검사를 한 번에 처리 가능
- 나중에 팀 기능 확장 시 마이그레이션 비용 0

**(3) 첨부파일 저장소**
SQLite로 시작하지만 첨부파일 바이너리를 DB에 넣지 않는다. **Phase 1에서는 로컬 파일시스템 (`./uploads`) + DB에는 메타데이터만**. Phase 3에서 S3 호환(R2/MinIO)으로 추상화 가능한 인터페이스로 설계.

tRPC v11은 FormData/File/Blob을 procedure 입력으로 받을 수 있어, 첨부파일도 tRPC procedure로 통합 가능 (별도 REST 엔드포인트 불필요).

---

## 4. tRPC 도입 시 핵심 학습 포인트

### 4.1 Procedure 기본 구조

```typescript
const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const appRouter = t.router({
  card: t.router({
    getById: t.procedure
      .meta({ openapi: { method: "GET", path: "/cards/{id}" } }) // OpenAPI 노출
      .input(z.object({ id: z.string().uuid() }))
      .output(CardSchema)
      .query(async ({ input, ctx }) => {
        return await ctx.db.cards.findById(input.id);
      }),
  }),
});
```

**핵심 개념**

- `t.procedure`: 베이스 procedure. 여기에 `.use(middleware)` 체이닝으로 `protectedProcedure`, `workspaceProcedure` 등 파생.
- `.meta()`: OpenAPI 메타데이터. 없으면 OpenAPI에 포함 안 됨 (tRPC 전용).
- `.input()`: Zod 스키마로 입력 검증. 자동으로 클라이언트 타입에 반영.
- `.output()`: 출력 검증. `@trpc/openapi`(공식)는 output 추론도 가능하지만, 명시하는 게 학습/안정성에 유리.
- `.query()` vs `.mutation()`: HTTP semantics. query=GET, mutation=POST.

### 4.2 Context (인증/요청 정보)

```typescript
export const createContext = async (opts: {
  req: Request;
  resHeaders: Headers;
}) => {
  const sid = parseSidFromCookie(opts.req.headers.get("cookie"));
  const session = sid ? await loadSession(sid) : null;
  return {
    db,
    session,
    req: opts.req,
    resHeaders: opts.resHeaders,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
```

`@hono/trpc-server`는 Hono context도 함께 전달 가능 — 쿠키 설정 등 응답 조작 시 사용.

### 4.3 미들웨어 (인증/권한)

```typescript
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } }); // 타입 좁힘
});

export const protectedProcedure = t.procedure.use(isAuthed);

const hasWorkspaceAccess = t.middleware(async ({ ctx, input, next }) => {
  // input에서 workspaceId 추출, 권한 체크
  // ...
});

export const workspaceProcedure = protectedProcedure.use(hasWorkspaceAccess);
```

미민님이 Effect-TS 평가하셨던 걸 보면, 미들웨어 체인을 통한 컨텍스트 정제는 비슷한 결의 패턴입니다.

### 4.4 OpenAPI 생성 (공식 @trpc/openapi)

```typescript
import { generateOpenApiDocument } from "@trpc/openapi";
import { appRouter } from "./router";

const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "Kanban API",
  version: "1.0.0",
  baseUrl: "http://localhost:3000/trpc",
});

// JSON 파일로 export → Swagger UI 등에 제공
Bun.write("./openapi.json", JSON.stringify(openApiDocument, null, 2));
```

**핵심 특징**

- 라우터 코드를 변경하지 않음 (정적 타입 분석)
- `.output()` 없어도 추론으로 OpenAPI 생성 가능 (단 명시 권장)
- 11.x.x-alpha 버전이지만 공식 패키지이며 정식 stable이 임박

---

## 5. 단계별 로드맵

### Phase 1 — BFF + DB 기반

- **Step 1: 모노레포 골격** ← 현재 단계
- Step 2: `packages/db` (Drizzle + bun:sqlite + 인증/도메인 스키마)
- Step 3: `packages/trpc` 골격 (initTRPC, context, 미들웨어)
- Step 4: `apps/api` Hono + @hono/trpc-server 통합
- Step 5: 인증 procedure (auth.signup / login / logout / me)
- Step 6: 도메인 procedure (workspace, board, list, card)
- Step 7: OpenAPI spec 생성 + Swagger UI 마운트
- Step 8: 첨부파일 procedure (FormData)

### Phase 2 — TanStack Start 웹 앱

- 라우터 구조, Selective SSR 전략
- tRPC client 통합 (`@trpc/tanstack-react-query`)
- 칸반 UI + dnd-kit + 낙관적 업데이트
- 모바일 터치 최적화

### Phase 3 — RN 껍데기

- WebView 통합, 네이티브 ↔ 웹 메시지 브릿지
- 인증 토큰 보관 (Keychain/Keystore)
- 딥링크, 푸시 알림
- 네이티브 모듈에서 OpenAPI spec 활용 (필요 시)

### Phase 4 — 엔터프라이즈 다지기

- 옵저버빌리티 (OpenTelemetry, 에러 트래킹)
- E2E 테스트 (Playwright)
- CI/CD, 배포 전략

---

## 6. Step 1 — 실제 작업

### 6.1 사전 준비

```bash
# Bun 설치 (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# 또는 macOS Homebrew
brew install oven-sh/bun/bun

# 버전 확인 (1.2.x 이상 권장)
bun --version
```

### 6.2 디렉토리 생성

```bash
mkdir kanban && cd kanban
git init
```

### 6.3 루트 파일

#### `package.json`

```json
{
  "name": "kanban",
  "private": true,
  "type": "module",
  "packageManager": "bun@1.2.0",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "typecheck": "turbo run typecheck",
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "check": "biome check --write .",
    "ci": "biome ci ."
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0",
    "@biomejs/biome": "^1.9.4",
    "@types/bun": "latest"
  }
}
```

**의도 정리**

- `"type": "module"`: 모노레포 전체 ESM. Bun은 ESM 우선이고 `commonjs`는 레거시.
- `packageManager`: Turborepo가 Bun을 인식하려면 명시적 선언 필수.
- `workspaces` (array): Bun은 npm/yarn과 같은 형식. `pnpm-workspace.yaml` 같은 별도 파일 없음.
- `@types/bun`: Bun 글로벌 API 타입.
- `biome check`: lint + format + import 정렬을 한 번에 (평소 쓸 명령).
- `biome ci`: write 없이 검증만 (CI에서 사용).

#### `bunfig.toml`

```toml
[install]
# 학습 단계에서는 기본값 그대로 두되, phantom dependency 발생 시 검토

[install.scopes]
# 필요시 사설 레지스트리 등 추가
```

Bun 1.2부터 보안 기본값으로 postinstall이 비활성화됨. 필요한 경우 `trustedDependencies`를 `package.json`에 추가.

#### `turbo.json`

```json
{
  "$schema": "https://turborepo.org/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".output/**", "dist/**", ".tanstack/**", ".vinxi/**"],
      "inputs": ["$TURBO_DEFAULT$", "!**/*.md", "!.env*"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "outputs": []
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "openapi:generate": {
      "dependsOn": ["^build"],
      "outputs": ["openapi.json"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

**핵심 개념**

- `tasks`: Turborepo 2.x부터 `pipeline` → `tasks`로 변경.
- `dependsOn: ["^build"]`의 `^`: "이 패키지가 의존하는 다른 패키지의 build를 먼저". 태스크 그래프의 핵심.
- `outputs`: 캐시 대상. 입력이 같으면 빌드 스킵하고 복원.
- `inputs`: 캐시 키 계산. README만 고치면 빌드 캐시 무효화 안 됨.
- `dev: { cache: false, persistent: true }`: dev 서버는 캐시하지 않고, persistent로 다른 태스크가 기다리지 않게 함.
- `db:generate` / `db:migrate`: Drizzle 마이그레이션 명령. 캐시 안 함 (DB 상태는 캐시 대상이 아님).
- `openapi:generate`: tRPC 라우터에서 OpenAPI spec 생성. 빌드 의존성 따라 실행.

**`lint` task가 빠진 이유**: Biome가 너무 빨라서(1초 이내) Turbo의 캐시 오버헤드가 오히려 손해. 루트에서 직접 `biome check` 실행.

#### `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": [
      "**/node_modules",
      "**/dist",
      "**/.output",
      "**/.tanstack",
      "**/.vinxi",
      "**/.turbo",
      "**/*.tsbuildinfo",
      "**/drizzle/**",
      "**/openapi.json"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error",
        "useExhaustiveDependencies": "error"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useImportType": "error",
        "useNamingConvention": "off"
      },
      "suspicious": {
        "noExplicitAny": "warn",
        "noConsole": {
          "level": "warn",
          "options": { "allow": ["warn", "error", "info"] }
        }
      },
      "complexity": {
        "noBannedTypes": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always",
      "arrowParentheses": "always",
      "bracketSpacing": true
    }
  },
  "json": {
    "parser": {
      "allowComments": true
    },
    "formatter": {
      "trailingCommas": "none"
    }
  },
  "overrides": [
    {
      "include": ["apps/web/**/*.{ts,tsx,jsx}"],
      "linter": {
        "rules": {
          "a11y": {
            "recommended": true
          }
        }
      }
    }
  ]
}
```

**핵심 룰 의도**

- `vcs.useIgnoreFile: true`: `.gitignore` 자동 존중.
- `organizeImports.enabled: true`: import 자동 정렬.
- `useExhaustiveDependencies: error`: React Hooks의 deps 배열 검사.
- `useImportType: error`: `import type { Foo }` 강제. 트리쉐이킹 정확도 ↑.
- `overrides`: `apps/web`에만 a11y 룰 추가.
- `openapi.json` 무시: 자동 생성 파일은 lint 대상 아님.

#### `.gitignore`

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
build/
.output/
.tanstack/
.vinxi/
*.tsbuildinfo

# Turbo
.turbo/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
!.vscode/settings.json
!.vscode/extensions.json

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# DB (다음 Step에서)
*.db
*.db-journal
*.db-shm
*.db-wal

# OpenAPI 자동 생성 (정책 결정 필요 — 일단 생성물은 커밋)
# openapi.json
```

**중요**

- `bun.lockb` (또는 `bun.lock`)는 `.gitignore`에 **넣지 않는다**. 모노레포 reproducibility의 핵심.
- `openapi.json`: 자동 생성물이지만, PR 리뷰에서 API 변경을 한눈에 보려고 커밋하는 게 일반적. CI에서 자동 갱신하는 경우 `.gitignore`에 추가하고 별도 호스팅.

#### `.nvmrc`

```
22
```

옵션 A(Bun 올인)에서는 사실 불필요하지만, 일부 도구가 Node를 요구할 수 있어 유지.

### 6.4 공유 config 패키지

#### `packages/config-typescript/package.json`

```json
{
  "name": "@kanban/config-typescript",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json", "bun.json", "react.json"]
}
```

#### `packages/config-typescript/base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2023",
    "module": "Preserve",
    "moduleResolution": "Bundler",
    "lib": ["ES2023"],

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,

    "incremental": true
  },
  "exclude": ["node_modules", "dist", ".output", ".tanstack", ".vinxi"]
}
```

**Bun 환경 맞춤 변경점**

- `module: "Preserve"` + `moduleResolution: "Bundler"`: Bun은 ESM/CJS 호환을 똑똑하게 처리. Vite/번들러가 처리하므로 `Bundler` 모드.
- `allowImportingTsExtensions: true`: Bun은 `import './foo.ts'` 네이티브 지원.
- `noEmit: true`: TS는 타입 체크만, 변환은 Bun/Vite가.
- `noUncheckedIndexedAccess: true`: `arr[0]`이 `T | undefined`로 추론. tRPC에서 input 객체 접근할 때 안전.
- `verbatimModuleSyntax: true`: `import type` 강제. tRPC의 `type AppRouter` 패턴에 핵심적.

#### `packages/config-typescript/bun.json` (Hono BFF + tRPC server용)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2023"],
    "types": ["bun-types"],
    "jsx": "react-jsx"
  }
}
```

`bun-types`: Bun 글로벌 API + Bun이 구현한 Node 호환 모듈을 모두 커버.

#### `packages/config-typescript/react.json` (TanStack Start용)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "types": ["vite/client"]
  }
}
```

`jsx: "preserve"`는 TanStack Start (Vinxi/Vite)가 JSX를 직접 처리.

#### `packages/config-biome/package.json`

```json
{
  "name": "@kanban/config-biome",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./base": "./base.json",
    "./bun": "./bun.json",
    "./react": "./react.json"
  },
  "files": ["base.json", "bun.json", "react.json"]
}
```

#### `packages/config-biome/base.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "linter": {
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "style": {
        "useImportType": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  }
}
```

#### `packages/config-biome/bun.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "extends": ["./base.json"],
  "linter": {
    "rules": {
      "suspicious": {
        "noConsole": {
          "level": "warn",
          "options": { "allow": ["warn", "error", "info"] }
        }
      }
    }
  }
}
```

#### `packages/config-biome/react.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "extends": ["./base.json"],
  "linter": {
    "rules": {
      "a11y": {
        "recommended": true
      },
      "correctness": {
        "useExhaustiveDependencies": "error"
      }
    }
  }
}
```

**다음 Step에서 사용 방법**: 각 앱의 자체 `biome.json`이 `extends`.

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "extends": ["@kanban/config-biome/bun"]
}
```

> **주의**: Biome 1.9의 `extends`는 npm 패키지 참조를 지원하지만, 일부 버전에서 모노레포 워크스페이스 패키지를 정확히 resolve 못하는 케이스가 있다. 막히면 상대 경로(`"../../packages/config-biome/bun.json"`)로 fallback. 다음 Step에서 실제 검증 예정.

### 6.5 의존성 설치 & 검증

```bash
bun install
```

**예상 결과**

- `node_modules/`가 루트에 생성 (Bun은 hoisted 방식)
- `bun.lockb` 생성
- 약 200~500ms 내 완료

**검증 명령**

```bash
# 워크스페이스 인식 확인
bun pm ls

# 루트에 설치된 도구 동작 확인
bun biome --version    # 1.9.x
bun turbo --version    # 2.3.x
bun tsc --version      # 5.7.x

# Biome 동작 (코드 없으니 빈 결과)
bun run check

# Turbo 동작 확인
bun run typecheck
```

`No tasks were executed as part of this run`이 나오면 정상 (아직 task 정의 안 됨).

### 6.6 완료 체크리스트

- [ ] `bun install`이 1초 내에 완료
- [ ] `bun.lockb` 생성
- [ ] `node_modules/`가 루트에만 생성 (각 패키지 폴더에는 없음 — hoisted)
- [ ] `packages/config-typescript`, `packages/config-biome` 모두 `package.json` 존재
- [ ] `bun run check` 실행 시 lint/format 에러 없음
- [ ] git 상태에 `bun.lockb`가 트래킹 대상으로 포함됨

---

## 7. 학습 포인트

### 7.1 Bun의 hoisted vs pnpm의 strict

Bun은 hoisted layout이라 더 많은 패키지와 호환되지만 phantom dependency를 허용한다. 학습 단계엔 큰 문제 없지만, 엔터프라이즈 운영 시점엔 주의. CI에서 명시적 의존성만 쓰는지 검증하는 단계 필요 (예: `depcheck`, `knip`).

### 7.2 Bun의 TypeScript 처리

Bun은 TS/TSX를 네이티브 트랜스파일. `bun src/index.ts`로 바로 실행. 단 **타입 체크는 따로** — Bun은 트랜스파일만 하고 타입 검증은 안 함. 그래서 `typecheck` task 별도 존재.

### 7.3 Biome가 ESLint를 못 대체하는 케이스

- `eslint-plugin-react-hooks`의 일부 정밀한 룰
- 커스텀 ESLint 룰
- 일부 Next.js/TanStack 관련 플러그인

우리 스택(TanStack Start)은 plugin 의존성이 거의 없어서 Biome로 충분.

### 7.4 Just-in-Time vs Compiled Package

- **JIT**: 패키지가 `.ts` 파일을 그대로 export. 소비자가 알아서 빌드.
- **Compiled**: 패키지가 `tsc`로 빌드해서 `dist/`를 export.

이 프로젝트는 **JIT으로 시작**. 빌드 단계 추가 없음 → 개발 빠름. Vite/Bun이 알아서 처리. 단점: 소비자도 같은 컴파일러를 써야 함 (모두 TS이므로 문제 없음).

**예외**: `packages/trpc`는 server/types를 분리 export해야 하므로 약간 더 신경 써야 함 — 다음 Step에서 다룸.

### 7.5 `workspace:*` 프로토콜

패키지 간 의존성:

```json
"dependencies": {
  "@kanban/db": "workspace:*"
}
```

Bun이 npm 레지스트리에서 찾지 않고 워크스페이스 내부 패키지를 hoisted symlink로 연결. 빌드 시점에는 실제 버전으로 치환되므로 publish해도 안전.

### 7.6 tRPC v11 + OpenAPI 학습 포인트 (다음 Step부터)

- `initTRPC.meta<OpenApiMeta>()` 패턴
- procedure builder 체이닝 (`.use().input().output().query()`)
- 미들웨어로 ctx 좁히기 (TS narrowing)
- `@trpc/openapi`의 정적 분석 메커니즘
- server-only / client-safe export 분리

---

## 8. 자주 발생할 문제

| 증상                                              | 원인                                  | 해결                                                                |
| ------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `bun install` 시 native 모듈 경고                 | Bun 1.2부터 postinstall 기본 비활성화 | `trustedDependencies`에 추가                                        |
| Biome가 워크스페이스 패키지의 `extends`를 못 찾음 | 일부 버전 resolve 이슈                | 상대 경로로 우회                                                    |
| VSCode에서 Biome가 안 잡힘                        | 익스텐션 미설치                       | `biomejs.biome` 설치 + `"editor.defaultFormatter": "biomejs.biome"` |
| Turbo 명령 실패                                   | `packageManager` 필드 누락            | `package.json`에 `"packageManager": "bun@1.2.0"` 명시               |

---

## 9. 다음 단계 (Phase 1, Step 2)

**작업 내용**

1. `packages/db` 생성, Drizzle + bun:sqlite 설정
2. UUID v7 생성 헬퍼
3. 인증 스키마 (`users`, `sessions` with sid 해시)
4. 도메인 스키마 1차 (`workspaces`, `workspace_members`, `boards`, `lists`, `cards`)
5. 마이그레이션 워크플로 (`drizzle-kit generate` + `migrate`)
6. seed 스크립트 골격

이후 Step 3에서 `packages/trpc` 골격을 만든다.

---

## 부록 A: 의사결정 히스토리

| 시점   | 결정                                      | 이유                                                       |
| ------ | ----------------------------------------- | ---------------------------------------------------------- |
| 초기   | RN + WebView + TanStack Start             | RN으로 웹뷰 호스팅, 대부분 기능을 웹으로                   |
| 초기   | Hono BFF + SQLite                         | 학습 가치 + 로컬 개발 친화                                 |
| 초기   | 멀티유저 / 풍부 도메인 / Turborepo        | 엔터프라이즈급 학습                                        |
| 초기   | 직접 인증 구현 (sid → access token)       | 학습 + 검증된 패턴                                         |
| 초기   | better-sqlite3                            | Node 전용, 가장 빠름                                       |
| 초기   | 세션 ID 해시 저장 (SHA-256)               | 엔터프라이즈 권장                                          |
| 초기   | UUID v7                                   | 시간 정렬 + 추측 불가                                      |
| 변경 1 | **Bun 올인** (옵션 A)                     | 일관성 + 학습량 최대 + Hono 시너지                         |
| 변경 1 | **better-sqlite3 → bun:sqlite**           | Bun 내장, 더 빠름                                          |
| 변경 1 | **ESLint+Prettier → Biome**               | 통합, 10~25배 빠름                                         |
| 변경 2 | **tRPC 도입 (올인)**                      | 모든 BFF 로직을 tRPC procedure로                           |
| 변경 2 | `packages/api-contract` → `packages/trpc` | tRPC가 동일 역할 + 풍부                                    |
| 변경 2 | **tRPC v11** (v10 아님)                   | TanStack Query v5 통합, FormData/File 지원, 공식 stable    |
| 변경 2 | **@trpc/openapi (공식 alpha)**            | 라우터 변경 없이 OpenAPI 생성, 미민님 원칙(공식 자료) 부합 |

---

## 부록 B: 폐기된 옵션과 사유

학습 차원에서 이전에 검토되었으나 폐기된 옵션들:

| 폐기된 옵션                             | 폐기 사유                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| pnpm workspace                          | Bun 올인 결정으로 대체                                                        |
| ESLint + Prettier                       | Biome로 통합                                                                  |
| `@hono/zod-openapi` (Hono 자체 OpenAPI) | tRPC 도입으로 BFF 패러다임 자체가 변경                                        |
| Hono RPC (`hc<AppType>`)                | tRPC가 동일 역할 + 풍부                                                       |
| `packages/api-contract`                 | tRPC가 contract 역할 통합                                                     |
| tRPC v10                                | TanStack Query v5 미지원, FormData 미지원, OpenAPI 라이브러리 모두 deprecated |
| `trpc-to-openapi` (비공식)              | 공식 `@trpc/openapi`가 alpha지만 미민님 "공식 자료" 원칙 부합                 |
| `oRPC`                                  | 자료 부족, tRPC 생태계가 더 성숙                                              |

---

## 부록 C: tRPC 도입으로 영향받는 다른 결정들

| 항목                | 이전                                | 이후 (tRPC 도입)                               |
| ------------------- | ----------------------------------- | ---------------------------------------------- |
| BFF 라우팅 방식     | Hono REST 엔드포인트                | tRPC procedure (`/trpc/*` catch-all)           |
| 클라이언트 호출     | `hono/client`의 `hc<AppType>`       | `@trpc/client`의 `createTRPCClient<AppRouter>` |
| 입력 검증 위치      | Hono 핸들러 + `@hono/zod-validator` | tRPC procedure의 `.input(zodSchema)`           |
| 출력 검증 위치      | 직접 처리                           | tRPC procedure의 `.output(zodSchema)`          |
| 에러 처리           | Hono 미들웨어                       | tRPC `TRPCError` + 표준 에러 코드              |
| 인증 미들웨어       | Hono 미들웨어                       | tRPC 미들웨어 + `protectedProcedure` 패턴      |
| 첨부파일 업로드     | Hono REST 엔드포인트 (multipart)    | tRPC v11의 FormData 지원 procedure             |
| OpenAPI 문서화      | `@hono/zod-openapi` 자동            | `@trpc/openapi` 정적 분석                      |
| TanStack Query 통합 | 수동 `queryFn` 작성                 | `@trpc/tanstack-react-query`                   |
| 타입 안전성         | Hono RPC 타입 export                | `type AppRouter` import                        |
