# EvoDev 실행 예제

이 문서는 EvoDev 프레임워크를 실제로 적용하는 예제를 보여줍니다.

## 예제: Todo 앱 개발

### Phase 1: 전체 설계

#### 1.1 비즈니스 분석 산출물

```markdown
## 프로젝트 개요
- 프로젝트명: SimpleTodo
- 목적: 개인 할 일 관리 웹 애플리케이션
- 대상 사용자: 일반 사용자

## 핵심 요구사항
1. 할 일 추가
   - 제목과 설명을 입력하여 새 할 일 생성
   - 수용 기준: 빈 제목은 허용하지 않음

2. 할 일 목록 조회
   - 모든 할 일을 목록으로 표시
   - 수용 기준: 최신순 정렬

3. 할 일 완료 처리
   - 할 일의 완료 상태 토글
   - 수용 기준: 완료된 항목은 시각적으로 구분

4. 할 일 삭제
   - 할 일 영구 삭제
   - 수용 기준: 삭제 전 확인 필요

## 비기능 요구사항
- 성능: 100개 이상의 할 일도 빠르게 로드
- 보안: 사용자별 데이터 격리 (향후)

## 제약 조건
- 기술 스택: React + TypeScript
- 저장소: LocalStorage (초기 버전)
```

#### 1.2 아키텍처 설계 산출물

```markdown
## 기술 스택
- Frontend: React 18 + TypeScript
- 상태관리: React useState
- 스타일링: CSS Modules
- 저장소: LocalStorage

## 데이터 모델
interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
}

## 디렉토리 구조
src/
├── components/
│   ├── TodoList/
│   ├── TodoItem/
│   ├── TodoForm/
│   └── common/
├── hooks/
│   └── useTodos.ts
├── types/
│   └── todo.ts
├── utils/
│   └── storage.ts
└── App.tsx
```

---

### Phase 2: 기능 맵 생성

#### 2.1 기능 추출

```markdown
### Feature: 데이터 모델 및 저장소 설정
- **ID**: F001
- **설명**: Todo 타입 정의 및 LocalStorage 유틸리티 구현
- **의존성**: 없음

### Feature: Todo 목록 조회
- **ID**: F002
- **설명**: 저장된 모든 Todo를 화면에 표시
- **의존성**: F001

### Feature: Todo 추가
- **ID**: F003
- **설명**: 새로운 Todo 항목 생성
- **의존성**: F001, F002

### Feature: Todo 완료 토글
- **ID**: F004
- **설명**: Todo의 완료 상태 변경
- **의존성**: F002

### Feature: Todo 삭제
- **ID**: F005
- **설명**: Todo 항목 삭제 (확인 포함)
- **의존성**: F002
```

#### 2.2 기능 DAG

```
F001 (데이터 모델)
  │
  ▼
F002 (목록 조회)
  │
  ├──────┬──────┐
  ▼      ▼      ▼
F003   F004   F005
(추가) (토글) (삭제)
```

**개발 순서**: F001 → F002 → F003 → F004 → F005

---

### Phase 3: 반복적 기능 개발

#### F001 구현: 데이터 모델 및 저장소

**상세 설계:**
```markdown
## 변경 파일
1. src/types/todo.ts - Todo 인터페이스 정의
2. src/utils/storage.ts - LocalStorage 래퍼 함수

## 구현 계획
1. Todo 타입 정의
2. getTodos(), saveTodos() 함수 구현
```

**구현:**
```typescript
// src/types/todo.ts
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
}

// src/utils/storage.ts
import { Todo } from '../types/todo';

const STORAGE_KEY = 'todos';

export function getTodos(): Todo[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTodos(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
```

**완료 체크:**
- [x] 타입 정의 완료
- [x] 저장/조회 함수 구현
- [x] 빌드 성공

---

#### F002 구현: Todo 목록 조회

**상세 설계:**
```markdown
## 변경 파일
1. src/hooks/useTodos.ts - 커스텀 훅
2. src/components/TodoItem/TodoItem.tsx - 개별 항목 컴포넌트
3. src/components/TodoList/TodoList.tsx - 목록 컴포넌트

## 구현 계획
1. useTodos 훅으로 상태 관리
2. TodoItem 컴포넌트 구현
3. TodoList에서 목록 렌더링
```

*(...이하 기능별로 반복)*

---

## TodoWrite 활용 예시

EvoDev 진행 시 다음과 같이 TodoWrite를 활용합니다:

```json
[
  {"content": "[Phase1] 비즈니스 분석", "status": "completed"},
  {"content": "[Phase1] 아키텍처 설계", "status": "completed"},
  {"content": "[Phase2] 기능 추출 및 DAG 생성", "status": "completed"},
  {"content": "[F001] 데이터 모델 및 저장소", "status": "completed"},
  {"content": "[F002] Todo 목록 조회", "status": "in_progress"},
  {"content": "[F003] Todo 추가", "status": "pending"},
  {"content": "[F004] Todo 완료 토글", "status": "pending"},
  {"content": "[F005] Todo 삭제", "status": "pending"}
]
```

---

## 대화 예시

```
사용자: Todo 앱을 만들고 싶어

Claude: EvoDev 프레임워크로 Todo 앱을 개발하겠습니다.

## Phase 1: 전체 설계

### 1.1 비즈니스 분석
먼저 요구사항을 정리하겠습니다. 다음 사항들을 확인해주세요:
1. 어떤 기능이 필요한가요? (추가/조회/수정/삭제)
2. 데이터 저장은 어디에 할까요? (LocalStorage/서버)
3. 사용자 인증이 필요한가요?

사용자: 기본적인 CRUD 기능, LocalStorage 사용, 인증은 나중에

Claude: 요구사항을 정리했습니다.
[비즈니스 분석 산출물 작성]

### 1.2 아키텍처 설계
[아키텍처 설계 산출물 작성]

Phase 1이 완료되었습니다. Phase 2로 진행할까요?

사용자: 네

Claude: ## Phase 2: 기능 맵 생성
[기능 추출 및 DAG 생성]

다음 순서로 개발하겠습니다:
1. F001: 데이터 모델
2. F002: 목록 조회
...

Phase 3를 시작하겠습니다. F001부터 구현합니다.
[TodoWrite로 진행 상황 추적]
```

---

## 예제: Figma 연동 Dashboard 앱 개발

이 예제는 Figma MCP를 활용하여 UI를 구현하는 과정을 보여줍니다.

### Phase 1: 전체 설계 (Figma 연동 포함)

#### 1.1 비즈니스 분석 산출물

```markdown
## 프로젝트 개요
- 프로젝트명: Analytics Dashboard
- 목적: 사용자 행동 분석 대시보드
- 대상 사용자: 마케팅/제품 팀

## 핵심 요구사항
1. 대시보드 메인 화면
   - 주요 지표 카드 표시
   - 차트 시각화
2. 필터 기능
   - 날짜 범위 선택
   - 사용자 세그먼트 필터
```

#### 1.2 아키텍처 설계 산출물

```markdown
## 기술 스택
- Frontend: Next.js 14 + TypeScript
- 스타일링: Tailwind CSS
- 차트: Recharts
- 상태관리: Zustand

## 디렉토리 구조
src/
├── components/
│   ├── dashboard/
│   ├── charts/
│   └── common/
├── styles/
│   └── tokens.css
└── app/
    └── dashboard/
```

#### 1.3 디자인 시스템 연동 (Figma MCP)

```markdown
## Figma 연동 확인 대화

Claude: UI가 포함된 프로젝트입니다. 다음을 확인해주세요:

1. **Figma MCP가 연동되어 있나요?**
2. **Figma 파일 URL을 공유해주세요**
3. **디자인 시스템이 정의되어 있나요?**

사용자: 네, Figma MCP가 연동되어 있어요.
파일 URL: https://figma.com/file/abc123/Dashboard-Design
디자인 시스템은 Figma 내에 정의되어 있습니다.

Claude: Figma 파일 구조를 확인하겠습니다.
[Figma MCP get_file 호출]

파일 구조를 확인했습니다:
- Pages: Design System, Dashboard, Components
- 주요 프레임: MetricCard, Chart, FilterBar

## 마이그레이션 전략 수립

Claude: 디자인 데이터를 프로젝트에 적용하는 방식을 결정해야 합니다.

### 질문 1: 컴포넌트 변환 방식
1. 직접 변환: Figma → 프로젝트 컴포넌트 1:1
2. 참조 변환: Figma 참고 + UI 라이브러리 활용
3. 하이브리드: 핵심은 직접, 나머지는 라이브러리

사용자: 하이브리드로 진행해주세요. MetricCard와 FilterBar는 직접 변환하고,
버튼이나 입력 필드는 shadcn/ui를 사용할게요.

### 질문 2: 스타일 추출 방식
1. 디자인 토큰: CSS Variables / JSON 토큰
2. CSS 직접 생성
3. Tailwind 클래스 매핑

사용자: Tailwind를 쓰니까 3번으로 해주세요.
Figma 색상은 Tailwind config에 추가하면 좋겠어요.

### 질문 3: 레이아웃 구현
1. Flexbox/Grid 변환
2. 반응형 우선 설계

사용자: 반응형이 중요해요. Figma는 데스크톱 기준이지만
모바일도 고려해주세요.

Claude: 마이그레이션 전략을 정리했습니다:

| 항목 | 선택 | 세부사항 |
|-----|------|---------|
| 컴포넌트 | 하이브리드 | 핵심 직접, 공통 shadcn/ui |
| 스타일 | Tailwind | Figma 색상 → Tailwind config |
| 레이아웃 | 반응형 우선 | 데스크톱 + 모바일 |
| 에셋 | SVG 인라인 | 아이콘 컴포넌트화 |
```

---

### Phase 2: 기능 맵 생성 (Figma 노드 매핑 포함)

#### 2.1 기능 추출 및 DAG

```markdown
### Feature: 디자인 토큰 설정
- **ID**: F001
- **설명**: Figma 스타일을 Tailwind config로 변환
- **의존성**: 없음

### Feature: 공통 컴포넌트
- **ID**: F002
- **설명**: MetricCard, FilterBar 컴포넌트 구현
- **의존성**: F001

### Feature: 대시보드 메인 화면
- **ID**: F003
- **설명**: 대시보드 레이아웃 및 컴포넌트 배치
- **의존성**: F002

## DAG
F001 → F002 → F003
```

#### 2.2 Figma 노드 매핑

```markdown
## F002: 공통 컴포넌트 Figma 매핑

Claude: F002 기능에 필요한 Figma 노드를 매핑했습니다.
[Figma MCP get_node 호출]

### MetricCard
| UI 요소 | Figma 노드 ID | Figma 경로 |
|--------|--------------|-----------|
| 전체 카드 | 123:456 | Components/MetricCard |
| 제목 | 123:457 | Components/MetricCard/Title |
| 값 | 123:458 | Components/MetricCard/Value |
| 변화율 | 123:459 | Components/MetricCard/Change |

### FilterBar
| UI 요소 | Figma 노드 ID | Figma 경로 |
|--------|--------------|-----------|
| 컨테이너 | 234:100 | Components/FilterBar |
| 날짜 선택기 | 234:101 | Components/FilterBar/DatePicker |
| 드롭다운 | 234:102 | Components/FilterBar/Dropdown |

### 확인 질문
1. 매핑된 Figma 노드가 정확한가요?
2. 추가로 참조해야 할 디자인이 있나요?

사용자: MetricCard에 아이콘도 있어요, 그것도 추가해주세요.

Claude: 아이콘 노드를 추가했습니다:
| 아이콘 | 123:460 | Components/MetricCard/Icon |
```

---

### Phase 3: 반복적 기능 개발 (Figma 마이그레이션)

#### F001: 디자인 토큰 설정

```markdown
Claude: F001을 시작합니다. Figma에서 디자인 토큰을 추출하겠습니다.
[Figma MCP get_styles 호출]

## 추출된 토큰

### 색상 (Figma → Tailwind)
| Figma 스타일 | 값 | Tailwind 이름 |
|-------------|-----|--------------|
| Primary/500 | #3B82F6 | primary |
| Gray/50 | #F9FAFB | gray-50 |
| Success/500 | #10B981 | success |
| Danger/500 | #EF4444 | danger |

### 구현
tailwind.config.ts에 커스텀 색상을 추가했습니다.

사용자: 좋아요, 진행해주세요!

[F001 완료]
```

#### F002: 공통 컴포넌트 (MetricCard)

```markdown
## [F002] UI 구현 방향 확인

Claude: Figma 노드 123:456을 기반으로 MetricCard를 구현하려고 합니다.
[Figma MCP get_node 호출 - 상세 정보 조회]

### Figma 디자인 분석
- **레이아웃**: Auto Layout Vertical
- **패딩**: 24px
- **간격**: 12px
- **배경**: #FFFFFF
- **모서리**: 12px
- **그림자**: 0 1px 3px rgba(0,0,0,0.1)

### 자식 요소
| 요소 | 스타일 |
|-----|--------|
| 아이콘 | 24x24, Primary/500 |
| 제목 | 14px, Gray/500, Medium |
| 값 | 32px, Gray/900, Bold |
| 변화율 | 14px, Success/500 또는 Danger/500 |

### 구현 계획
```tsx
// MetricCard.tsx
interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
}
```

### 확인 질문
1. 이 방향으로 진행해도 될까요?
2. 추가 상태(hover 등)가 필요한가요?

사용자: 좋아요! hover 시 약간 떠오르는 효과 추가해주세요.

Claude: hover 효과를 추가하여 구현하겠습니다.
[구현 진행]

## [F002] UI 구현 결과 확인

### 생성된 파일
- `src/components/dashboard/MetricCard.tsx`
- `src/components/dashboard/index.ts`

### Figma 대비 구현 결과
| 항목 | Figma | 구현 | 비고 |
|-----|-------|------|------|
| 레이아웃 | Auto Layout | flex-col | ✅ |
| 패딩 | 24px | p-6 | ✅ |
| 모서리 | 12px | rounded-xl | ✅ |
| hover | 없음 | shadow-lg + translateY | 추가 |

### 확인 질문
1. 구현 결과가 디자인과 일치하나요?
2. 수정이 필요한 부분이 있나요?

사용자: 완벽해요! 다음으로 진행해주세요.

[F002 완료]
```

---

## 대화 예시 (Figma 연동 흐름)

```
사용자: Dashboard 앱을 만들고 싶어요. Figma에 디자인이 있어요.

Claude: EvoDev 프레임워크로 Dashboard 앱을 개발하겠습니다.
Figma MCP 연동이 확인되었습니다.

## Phase 1: 전체 설계

### 1.1 비즈니스 분석
[요구사항 정리]

### 1.2 아키텍처 설계
[기술 스택 및 구조 정의]

### 1.3 디자인 시스템 연동
Figma 파일 URL을 공유해주세요. 디자인 데이터를 어떻게 프로젝트에
적용할지 함께 결정하겠습니다.

사용자: https://figma.com/file/abc123

Claude: 파일 구조를 확인했습니다. 마이그레이션 전략을 수립하겠습니다.

[컴포넌트/스타일/레이아웃/에셋 변환 방식 질문]

사용자: [각 질문에 답변]

Claude: 전략이 확정되었습니다. Phase 2로 진행합니다.

## Phase 2: 기능 맵 생성
[기능 추출 및 Figma 노드 매핑]

각 UI 기능에 대해 Figma 노드를 매핑했습니다.
확인해주세요.

사용자: 확인했어요, 진행해주세요.

## Phase 3: 반복적 기능 개발
[각 기능 구현 시 Figma 확인 → 구현 → 결과 검토 루프]

F002 MetricCard를 구현하겠습니다.
[Figma 분석 결과 및 구현 계획 제시]

이 방향으로 진행해도 될까요?

사용자: 네!

[구현 후]
구현 결과를 확인해주세요.
[Figma vs 구현 비교 테이블]

사용자: 좋아요!

[다음 기능으로 진행...]
```
