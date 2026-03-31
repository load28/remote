/**
 * =============================================================================
 * TodoItem - 개별 Todo 아이템
 * =============================================================================
 *
 * 🔑 Relay 핵심 개념: useFragment
 *
 * useFragment는 부모로부터 전달받은 Fragment ref에서 데이터를 읽습니다.
 *
 * 동작 원리:
 * 1. 부모(TodoList)가 TodoItem_todo Fragment ref를 props로 전달
 * 2. useFragment가 Relay Store에서 해당 데이터를 읽어옴
 * 3. 이 Fragment에 포함된 필드가 변경되면 자동으로 리렌더링
 * 4. 다른 Fragment의 데이터 변경에는 반응하지 않음 → 불필요한 리렌더 방지
 *
 * 🔑 Data Masking (데이터 마스킹)
 *
 * 이 컴포넌트는 TodoItem_todo Fragment에서 선언한 필드만 접근 가능합니다.
 * 부모가 쿼리에서 다른 필드를 가져왔더라도 여기서는 보이지 않습니다.
 * → 컴포넌트의 데이터 의존성이 명시적이고 격리됨
 * → 한 컴포넌트의 데이터 변경이 다른 컴포넌트에 영향 주지 않음
 *
 * 🔑 Relay 핵심 개념: useMutation + Optimistic Response
 *
 * useMutation은 GraphQL Mutation을 실행합니다.
 * optimisticResponse를 제공하면:
 * 1. 서버 응답 전에 즉시 UI를 업데이트 (낙관적 업데이트)
 * 2. 서버 응답이 오면 실제 데이터로 교체
 * 3. 서버 에러 시 자동으로 롤백
 * → 사용자에게 즉각적인 피드백 제공
 * =============================================================================
 */
'use client';

import { useState, useCallback } from 'react';
import { useFragment, useMutation, graphql, ConnectionHandler } from 'react-relay';
import type { TodoItem_todo$key } from '@/__generated__/TodoItem_todo.graphql';
import type { TodoItemToggleMutation } from '@/__generated__/TodoItemToggleMutation.graphql';
import type { TodoItemUpdateMutation } from '@/__generated__/TodoItemUpdateMutation.graphql';
import type { TodoItemRemoveMutation } from '@/__generated__/TodoItemRemoveMutation.graphql';

// 이 컴포넌트의 Fragment: 필요한 데이터만 선언
const TodoItemFragment = graphql`
  fragment TodoItem_todo on Todo {
    id
    text
    completed
    createdAt
  }
`;

// Toggle Mutation
const ToggleMutation = graphql`
  mutation TodoItemToggleMutation($input: ToggleTodoInput!) {
    toggleTodo(input: $input) {
      todo {
        id
        completed
      }
    }
  }
`;

// Update Mutation
const UpdateMutation = graphql`
  mutation TodoItemUpdateMutation($input: UpdateTodoInput!) {
    updateTodo(input: $input) {
      todo {
        id
        text
      }
    }
  }
`;

// Remove Mutation
const RemoveMutation = graphql`
  mutation TodoItemRemoveMutation($input: RemoveTodoInput!) {
    removeTodo(input: $input) {
      deletedTodoId
    }
  }
`;

interface TodoItemProps {
  todo: TodoItem_todo$key; // Fragment ref - 실제 데이터가 아닌 참조
}

export function TodoItem({ todo }: TodoItemProps) {
  // useFragment: Fragment ref에서 실제 데이터를 추출
  // 이 Fragment의 필드가 변경될 때만 리렌더링됨
  const data = useFragment(TodoItemFragment, todo);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(data.text);

  // useMutation 반환값: [commitFn, isInFlight]
  const [commitToggle, isToggling] = useMutation<TodoItemToggleMutation>(ToggleMutation);
  const [commitUpdate, isUpdating] = useMutation<TodoItemUpdateMutation>(UpdateMutation);
  const [commitRemove, isRemoving] = useMutation<TodoItemRemoveMutation>(RemoveMutation);

  // =========================================================================
  // Toggle: Optimistic Response 예시
  // =========================================================================
  const handleToggle = useCallback(() => {
    commitToggle({
      variables: { input: { id: data.id } },

      // 🔑 Optimistic Response
      // 서버 응답을 기다리지 않고 즉시 UI 업데이트
      // Relay Store가 이 데이터로 임시 업데이트되고,
      // 서버 응답이 오면 실제 데이터로 교체됨
      optimisticResponse: {
        toggleTodo: {
          todo: {
            id: data.id,
            completed: !data.completed, // 현재의 반대값으로 예측
          },
        },
      },
    });
  }, [commitToggle, data.id, data.completed]);

  // =========================================================================
  // Update: 텍스트 수정
  // =========================================================================
  const handleUpdate = useCallback(() => {
    if (editText.trim() === '' || editText === data.text) {
      setIsEditing(false);
      setEditText(data.text);
      return;
    }

    commitUpdate({
      variables: { input: { id: data.id, text: editText.trim() } },
      optimisticResponse: {
        updateTodo: {
          todo: {
            id: data.id,
            text: editText.trim(),
          },
        },
      },
      onCompleted: () => setIsEditing(false),
    });
  }, [commitUpdate, data.id, data.text, editText]);

  // =========================================================================
  // Remove: Connection Updater 예시
  // =========================================================================
  const handleRemove = useCallback(() => {
    commitRemove({
      variables: { input: { id: data.id } },

      // 🔑 Optimistic Updater
      // Store를 직접 조작해서 삭제를 즉시 반영
      // ConnectionHandler.deleteNode로 Connection에서 노드를 제거
      optimisticUpdater: (store) => {
        const root = store.getRoot();
        const conn = ConnectionHandler.getConnection(root, 'TodoList_todos');
        if (conn) {
          ConnectionHandler.deleteNode(conn, data.id);
        }
      },

      // 서버 응답 후 실행되는 updater
      // optimisticUpdater와 같은 로직이지만, 서버 확인 후 최종 반영
      updater: (store) => {
        const root = store.getRoot();
        const conn = ConnectionHandler.getConnection(root, 'TodoList_todos');
        if (conn) {
          ConnectionHandler.deleteNode(conn, data.id);
        }
      },
    });
  }, [commitRemove, data.id]);

  const isInFlight = isToggling || isUpdating || isRemoving;

  return (
    <div className={`todo-item ${isInFlight ? 'optimistic' : ''}`}>
      <input
        type="checkbox"
        className="todo-checkbox"
        checked={data.completed}
        onChange={handleToggle}
        disabled={isToggling}
      />

      {isEditing ? (
        <input
          className="todo-edit-input"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleUpdate}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUpdate();
            if (e.key === 'Escape') {
              setIsEditing(false);
              setEditText(data.text);
            }
          }}
          autoFocus
          disabled={isUpdating}
        />
      ) : (
        <span
          className={`todo-text ${data.completed ? 'completed' : ''}`}
          onDoubleClick={() => {
            setIsEditing(true);
            setEditText(data.text);
          }}
        >
          {data.text}
        </span>
      )}

      <button
        className="todo-delete-btn"
        onClick={handleRemove}
        disabled={isRemoving}
      >
        ×
      </button>
    </div>
  );
}
