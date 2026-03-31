/**
 * =============================================================================
 * TodoApp - 최상위 컴포넌트 (Query Root)
 * =============================================================================
 *
 * 🔑 Relay 핵심 개념: useLazyLoadQuery
 *
 * useLazyLoadQuery는 컴포넌트가 마운트될 때 GraphQL 쿼리를 실행합니다.
 * React Suspense와 통합되어, 데이터 로딩 중에는 가장 가까운
 * Suspense 바운더리의 fallback을 보여줍니다.
 *
 * 왜 "Lazy"인가?
 * → 컴포넌트가 렌더링될 때 비로소 쿼리를 시작함
 * → preloadQuery와 달리 라우트 전환 시점이 아닌 렌더 시점에 fetch
 *
 * 🔑 Relay 핵심 개념: Fragment Spread
 *
 * 이 컴포넌트의 쿼리는 ...TodoList_todos를 포함합니다.
 * 이것은 TodoList 컴포넌트가 "자신이 필요한 데이터"를 선언한 Fragment를
 * 이 쿼리에 포함(spread)시키는 것입니다.
 *
 * 장점:
 * - 각 컴포넌트가 자신의 데이터 요구사항을 소유
 * - 부모는 자식이 무슨 데이터를 필요로 하는지 알 필요 없음
 * - 컴파일 타임에 모든 Fragment가 합쳐져 하나의 네트워크 요청이 됨
 * =============================================================================
 */
'use client';

import { Suspense, useState } from 'react';
import { useLazyLoadQuery, graphql } from 'react-relay';
import type { TodoAppQuery as TodoAppQueryType, TodoFilter } from '@/__generated__/TodoAppQuery.graphql';
import { TodoList } from './TodoList';
import { AddTodo } from './AddTodo';

// GraphQL 쿼리 정의
// relay-compiler가 이 태그드 템플릿을 파싱해서 타입과 아티팩트를 생성
const TodoAppQuery = graphql`
  query TodoAppQuery($filter: TodoFilter, $first: Int!, $after: String) {
    # TodoList 컴포넌트의 Fragment를 spread
    # → TodoList가 필요한 데이터를 여기서 함께 요청
    ...TodoList_todos @arguments(filter: $filter, first: $first, after: $after)
  }
`;

function TodoAppContent() {
  const [filter, setFilter] = useState<TodoFilter>('ALL');

  // useLazyLoadQuery: 이 컴포넌트가 렌더링될 때 쿼리 실행
  // Suspense와 통합되어 로딩 중에는 fallback UI를 보여줌
  const data = useLazyLoadQuery<TodoAppQueryType>(
    TodoAppQuery,
    {
      filter,
      first: 5, // 한 번에 5개씩 로드 (페이지네이션 데모)
    },
    {
      // fetchPolicy: 데이터를 어디서 가져올지 결정
      // 'store-or-network': 캐시에 있으면 캐시, 없으면 네트워크
      // 'store-and-network': 캐시 먼저 보여주고, 백그라운드에서 최신 데이터 fetch
      // 'network-only': 항상 네트워크에서 fetch
      fetchPolicy: 'store-and-network',
    }
  );

  return (
    <>
      <AddTodo connectionId="client:root:__TodoList_todos_connection" />

      <TodoList query={data} />

      {/* 필터 버튼 */}
      <div className="todo-filters">
        {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' ? '전체' : f === 'ACTIVE' ? '미완료' : '완료'}
          </button>
        ))}
      </div>
    </>
  );
}

export function TodoApp() {
  return (
    // Suspense 바운더리: useLazyLoadQuery가 데이터를 로딩하는 동안 표시
    <Suspense fallback={<div className="loading">로딩 중...</div>}>
      <TodoAppContent />
    </Suspense>
  );
}
