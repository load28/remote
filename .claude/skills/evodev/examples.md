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
