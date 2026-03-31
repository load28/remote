# Relay + Next.js Todo App

Relay 학습을 위한 Todo 애플리케이션입니다.

## 실행 방법

```bash
cd relay-nextjs-todo

# 의존성 설치
npm install --legacy-peer-deps

# Relay 컴파일러 실행 (GraphQL → TypeScript 아티팩트 생성)
npx relay-compiler

# 개발 서버 실행 (GraphQL 서버 + Next.js 동시 실행)
npm run dev
```

- Next.js: http://localhost:3000
- GraphQL Playground: http://localhost:4000/graphql

## Relay 핵심 개념 가이드

### 1. Fragment Colocation (프래그먼트 코로케이션)

각 컴포넌트가 자신이 필요한 데이터를 GraphQL Fragment로 선언합니다.

```
TodoApp (Query)
  └─ ...TodoList_todos (Fragment)
       └─ ...TodoItem_todo (Fragment)
```

- **컴포넌트가 데이터 요구사항을 소유**: 부모는 자식이 뭘 필요로 하는지 몰라도 됨
- **하나의 네트워크 요청**: 컴파일 타임에 모든 Fragment가 합쳐짐
- **Data Masking**: 각 컴포넌트는 자신의 Fragment 데이터만 접근 가능

### 2. Relay Store (정규화된 캐시)

모든 GraphQL 데이터가 ID 기반으로 평탄화되어 저장됩니다.

```
Store = {
  "1": { id: "1", text: "Relay 학습", completed: true },
  "2": { id: "2", text: "Connection 구현", completed: false },
  "client:root": { todos: { __ref: "connection:..." } }
}
```

- 같은 ID의 데이터를 참조하는 모든 컴포넌트가 자동 업데이트
- Mutation 응답으로 ID가 같은 객체가 오면 Store가 자동 병합

### 3. Connection Pattern (페이지네이션)

Relay의 페이지네이션은 Connection 스펙을 따릅니다.

```graphql
todos(first: 5, after: "cursor") @connection(key: "TodoList_todos") {
  edges {
    cursor
    node { id, text, completed }
  }
  pageInfo {
    hasNextPage
    endCursor
  }
}
```

`usePaginationFragment`가 자동으로:
- 다음 페이지 fetch
- 기존 리스트에 병합
- `hasNext`, `isLoadingNext` 상태 관리

### 4. Optimistic Updates (낙관적 업데이트)

서버 응답 전에 UI를 먼저 업데이트합니다.

```typescript
commitToggle({
  variables: { input: { id } },
  optimisticResponse: {
    toggleTodo: {
      todo: { id, completed: !currentCompleted }
    }
  }
});
```

1. `optimisticResponse` → 즉시 Store 업데이트 → UI 반영
2. 서버 응답 도착 → 실제 데이터로 교체
3. 서버 에러 → 자동 롤백

### 5. Mutation Updater (Store 직접 조작)

리스트에 아이템 추가/삭제 시 `ConnectionHandler`를 사용합니다.

```typescript
// 추가
ConnectionHandler.insertEdgeBefore(connection, newEdge);

// 삭제
ConnectionHandler.deleteNode(connection, deletedId);
```

## 프로젝트 구조

```
relay-nextjs-todo/
├── server/
│   ├── schema.graphql     # GraphQL 스키마 (Node, Connection, Mutation 패턴)
│   └── index.ts           # GraphQL 서버 (graphql-yoga)
├── src/
│   ├── app/
│   │   ├── layout.tsx     # RelayProvider 적용
│   │   ├── page.tsx       # 메인 페이지
│   │   └── globals.css
│   ├── components/
│   │   ├── TodoApp.tsx    # useLazyLoadQuery (쿼리 루트)
│   │   ├── TodoList.tsx   # usePaginationFragment (페이지네이션)
│   │   ├── TodoItem.tsx   # useFragment + useMutation (CRUD)
│   │   └── AddTodo.tsx    # useMutation + ConnectionHandler
│   ├── relay/
│   │   ├── environment.ts # Relay Environment 설정
│   │   └── RelayProvider.tsx
│   └── __generated__/     # relay-compiler가 생성하는 타입/아티팩트
├── relay.config.json      # Relay 컴파일러 설정
├── next.config.ts         # Next.js + Relay SWC 설정
└── package.json
```

## Relay 워크플로우

1. `schema.graphql`에 스키마 정의
2. 컴포넌트에서 `graphql` 태그로 쿼리/프래그먼트/뮤테이션 작성
3. `relay-compiler` 실행 → `__generated__/` 에 타입과 아티팩트 생성
4. 생성된 타입을 import해서 타입 안전하게 사용
