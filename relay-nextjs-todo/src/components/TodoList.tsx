/**
 * =============================================================================
 * TodoList - 페이지네이션이 적용된 Todo 목록
 * =============================================================================
 *
 * 🔑 Relay 핵심 개념: usePaginationFragment
 *
 * Relay의 페이지네이션은 Connection 스펙을 기반으로 합니다.
 * usePaginationFragment는 다음을 자동으로 처리합니다:
 *
 * 1. 초기 데이터를 Fragment에서 읽기
 * 2. "더 보기" 시 다음 페이지 fetch
 * 3. 새 데이터를 기존 리스트에 자동 병합
 * 4. hasNext, isLoadingNext 등 페이지네이션 상태 관리
 *
 * 🔑 Relay 핵심 개념: @connection 디렉티브
 *
 * @connection(key: "TodoList_todos")는 이 Connection에 고유 키를 부여합니다.
 * 이 키는 다음에 사용됩니다:
 * - Store에서 Connection 데이터를 식별
 * - Mutation 후 Connection을 업데이트할 때 참조
 *   (예: 새 Todo를 추가하면 이 Connection에 edge를 삽입)
 *
 * 🔑 Relay 핵심 개념: @refetchable 디렉티브
 *
 * @refetchable은 Fragment를 독립적으로 re-fetch할 수 있게 만듭니다.
 * usePaginationFragment가 내부적으로 이를 사용해 다음 페이지를 요청합니다.
 *
 * 🔑 Relay 핵심 개념: Fragment의 데이터 마스킹
 *
 * TodoList_todos Fragment가 정의한 필드만 이 컴포넌트에서 접근 가능합니다.
 * TodoItem이 정의한 Fragment의 데이터는 TodoItem에서만 접근됩니다.
 * → 각 컴포넌트는 자신이 선언한 데이터만 볼 수 있음 (Data Masking)
 * → 이를 통해 컴포넌트 간 데이터 의존성이 명확해짐
 * =============================================================================
 */
'use client';

import { usePaginationFragment, graphql } from 'react-relay';
import type { TodoList_todos$key } from '@/__generated__/TodoList_todos.graphql';
import type { TodoListPaginationQuery } from '@/__generated__/TodoListPaginationQuery.graphql';
import { TodoItem } from './TodoItem';

// Fragment 정의 - 이 컴포넌트가 필요한 데이터를 선언적으로 명시
const TodoListFragment = graphql`
  fragment TodoList_todos on Query
  @argumentDefinitions(
    # Fragment에 전달되는 인자 정의
    # 부모 컴포넌트가 이 값들을 @arguments로 전달
    filter: { type: "TodoFilter", defaultValue: ALL }
    first: { type: "Int", defaultValue: 5 }
    after: { type: "String" }
  )
  @refetchable(queryName: "TodoListPaginationQuery") {
    todos(filter: $filter, first: $first, after: $after)
      @connection(key: "TodoList_todos") {
      edges {
        node {
          id
          # TodoItem의 Fragment를 spread
          # → TodoItem이 필요한 데이터도 여기서 함께 요청됨
          ...TodoItem_todo
        }
      }
      totalCount
    }
  }
`;

interface TodoListProps {
  query: TodoList_todos$key; // Fragment ref 타입 (Relay가 자동 생성)
}

export function TodoList({ query }: TodoListProps) {
  // usePaginationFragment: Connection 기반 페이지네이션 자동 처리
  const { data, loadNext, hasNext, isLoadingNext } =
    usePaginationFragment<TodoListPaginationQuery, TodoList_todos$key>(
      TodoListFragment,
      query
    );

  const todos = data.todos;

  if (!todos.edges.length) {
    return <div className="empty-state">할 일이 없습니다. 새로운 할 일을 추가해보세요!</div>;
  }

  return (
    <div className="todo-list">
      {todos.edges.map(({ node }) => (
        // 각 TodoItem에 Fragment ref를 전달
        // TodoItem은 자신의 Fragment를 통해 필요한 데이터만 읽음
        <TodoItem key={node.id} todo={node} />
      ))}

      {/* 페이지네이션 UI */}
      {hasNext && (
        <button
          className="load-more-btn"
          onClick={() => loadNext(5)} // 다음 5개를 추가 로드
          disabled={isLoadingNext}
        >
          {isLoadingNext ? '로딩 중...' : `더 보기 (총 ${todos.totalCount}개)`}
        </button>
      )}

      <div className="todo-footer">
        <span>{todos.totalCount}개의 할 일</span>
      </div>
    </div>
  );
}
