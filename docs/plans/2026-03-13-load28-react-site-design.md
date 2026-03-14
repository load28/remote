# load28 React 공식 문서 사이트 설계

## 개요

load28 React 코딩 규칙 78개 규칙과 레퍼런스 코드를 탐색할 수 있는 SSR 문서 사이트.
TanStack Start + Tailwind CSS로 구현, Vercel 배포.

## 대상 사용자

- 팀 내부 개발자: 규칙을 빠르게 찾아보는 레퍼런스
- 외부 개발자: load28 React 코딩 규칙을 학습하는 교육 자료

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | TanStack Start (Vinxi) | SSR 요구사항 |
| 스타일링 | Tailwind CSS v4 | 미니멀 직접 구현 |
| 마크다운 | unified + remark-gfm + rehype | 표준 파이프라인 |
| 코드 하이라이팅 | Shiki | 서버 사이드, 테마 풍부 |
| 검색 | Fuse.js (클라이언트) | 가벼운 fuzzy 검색 |
| 배포 | Vercel | SSR + Edge |
| 아이콘 | Lucide React | Tree-shakeable |

## 디렉토리 구조

```
load28-react-site/
├── app/
│   ├── routes/
│   │   ├── __root.tsx          # 루트 레이아웃 (사이드바 + 콘텐츠)
│   │   ├── index.tsx           # 랜딩 페이지 (개요 + 통계)
│   │   ├── rules/
│   │   │   ├── index.tsx       # 전체 규칙 검색/필터
│   │   │   └── $category.tsx   # 카테고리별 규칙 상세
│   │   ├── references/
│   │   │   ├── index.tsx       # 레퍼런스 코드 갤러리 (태그 필터)
│   │   │   └── $slug.tsx       # 개별 레퍼런스 상세
│   │   └── protocol.tsx        # 3-Phase 프로토콜 가이드
│   ├── components/
│   │   ├── layout/             # Sidebar, Header, Footer, TOC
│   │   ├── rules/              # RuleCard, RuleDetail, CodeBlock
│   │   └── references/         # ReferenceCard, TagFilter
│   └── lib/
│       ├── content.ts          # 마크다운 파싱 유틸리티
│       └── search.ts           # Fuse.js 검색 인덱스
├── content/                    # 사이트 전용 마크다운
│   ├── rules/
│   │   ├── architecture.md
│   │   ├── naming-conventions.md
│   │   ├── component-patterns.md
│   │   ├── state-and-data.md
│   │   ├── performance.md
│   │   └── testing-a11y.md
│   ├── references/             # reference-code 파일들
│   └── protocol.md             # 3-Phase 워크플로우
├── app.config.ts
├── tailwind.config.ts
└── package.json
```

## 콘텐츠 관리

- `content/` 디렉토리에 사이트 전용 마크다운 배치
- 원본 `.claude/skills/load28-react/`에서 복사 후 사이트에 최적화
- 빌드 타임에 unified/remark/rehype로 파싱
- Shiki로 서버 사이드 코드 하이라이팅

## 라우트 설계

| 경로 | 내용 | 렌더링 |
|------|------|--------|
| `/` | 랜딩 — 78개 규칙 통계, 6개 카테고리 카드, 빠른 검색 | Full SSR |
| `/rules` | 전체 규칙 목록 — ID/키워드 검색, 분류 필터 | SSR + 클라이언트 필터 |
| `/rules/[category]` | 카테고리 상세 — 규칙 목록, 앵커 내비, 코드 예시 | Full SSR |
| `/references` | 레퍼런스 갤러리 — 태그 기반 필터, 적용 규칙 표시 | SSR + 클라이언트 필터 |
| `/references/[slug]` | 레퍼런스 상세 — 코드 + 적용 규칙 링크 | Full SSR |
| `/protocol` | 3-Phase 워크플로우 시각화 | Full SSR |

## UI 레이아웃

```
┌─────────────────────────────────────────────┐
│  load28 React       [검색]    [GitHub]    │
├──────────┬──────────────────────────────────┤
│ 사이드바  │  콘텐츠 영역                      │
│          │                                   │
│ 홈       │  # A-01: 단방향 의존성             │
│ 규칙 ▾   │  분류: NEVER                      │
│  아키텍처 │  WHY: ...                         │
│  네이밍   │  ┌────────────────────────┐      │
│  컴포넌트 │  │ // ❌ BAD / ✅ GOOD    │      │
│  상태     │  │ 코드 예시              │      │
│  성능     │  └────────────────────────┘      │
│  테스트   │  검증: ...                        │
│ 레퍼런스  │                                   │
│ 프로토콜  │                                   │
└──────────┴──────────────────────────────────┘
```

## 검색

- 헤더 검색바에서 규칙 ID(`A-01`), 키워드(`useState`), 한글(`의존성`) 검색
- Fuse.js로 규칙 제목/WHY/코드 인덱싱
- 결과 클릭 시 해당 규칙 앵커로 이동

## 제외 사항

- 인터랙티브 체크리스트 (불필요)
- 라이브 코드 플레이그라운드 (Shiki 정적 하이라이팅만)
- CMS 연동 (마크다운 직접 관리)
