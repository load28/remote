/**
 * =============================================================================
 * AddTodo - 새 Todo 추가 (Mutation + Connection Updater)
 * =============================================================================
 *
 * 🔑 Relay 핵심 개념: ConnectionHandler를 활용한 리스트 업데이트
 *
 * 새 아이템을 추가할 때, 서버에서 전체 리스트를 다시 fetch하지 않습니다.
 * 대신 Mutation 응답으로 받은 새 edge를 기존 Connection에 삽입합니다.
 *
 * 방법 1: @appendEdge / @prependEdge 디렉티브 (선언적)
 * 방법 2: updater 함수에서 ConnectionHandler 사용 (명시적)
 *
 * 여기서는 방법 2를 사용합니다 (더 유연하고 학습에 좋음).
 *
 * 🔑 Relay 핵심 개념: Optimistic Update with Updater
 *
 * 1. optimisticUpdater: 서버 응답 전에 Store를 직접 조작
 *    → 임시 ID로 레코드를 만들어 Connection에 삽입
 *    → 사용자에게 즉각적인 피드백
 *
 * 2. 서버 응답 후: optimistic 데이터가 자동으로 롤백되고
 *    updater가 실제 서버 데이터로 Store를 업데이트
 * =============================================================================
 */
'use client';

import { useState, useCallback } from 'react';
import { useMutation, graphql, ConnectionHandler } from 'react-relay';
import type { AddTodoMutation } from '@/__generated__/AddTodoMutation.graphql';

const AddTodoMutationDef = graphql`
  mutation AddTodoMutation($input: AddTodoInput!) {
    addTodo(input: $input) {
      todoEdge {
        cursor
        node {
          id
          text
          completed
          createdAt
        }
      }
    }
  }
`;

interface AddTodoProps {
  connectionId: string; // Connection의 Store 키
}

export function AddTodo({ connectionId: _connectionId }: AddTodoProps) {
  const [text, setText] = useState('');
  const [commitMutation, isInFlight] = useMutation<AddTodoMutation>(AddTodoMutationDef);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || isInFlight) return;

      commitMutation({
        variables: { input: { text: trimmed } },

        // 🔑 Optimistic Updater: 서버 응답 전에 임시 데이터로 UI 업데이트
        optimisticUpdater: (store) => {
          // 1. 임시 Todo 레코드 생성
          const id = `client:newTodo:${Date.now()}`;
          const newTodo = store.create(id, 'Todo');
          newTodo.setValue(id, 'id');
          newTodo.setValue(trimmed, 'text');
          newTodo.setValue(false, 'completed');
          newTodo.setValue(new Date().toISOString(), 'createdAt');

          // 2. 임시 Edge 생성
          const newEdge = store.create(`client:newEdge:${Date.now()}`, 'TodoEdge');
          newEdge.setLinkedRecord(newTodo, 'node');

          // 3. Connection에 Edge를 맨 앞에 삽입
          const root = store.getRoot();
          const conn = ConnectionHandler.getConnection(root, 'TodoList_todos');
          if (conn) {
            ConnectionHandler.insertEdgeBefore(conn, newEdge);

            // totalCount도 증가
            const currentCount = conn.getValue('totalCount') as number;
            if (typeof currentCount === 'number') {
              conn.setValue(currentCount + 1, 'totalCount');
            }
          }
        },

        // 서버 응답 후 실행: 실제 데이터로 Connection 업데이트
        updater: (store) => {
          // Mutation payload에서 새로 생성된 edge를 가져옴
          const payload = store.getRootField('addTodo');
          const newEdge = payload.getLinkedRecord('todoEdge');

          const root = store.getRoot();
          const conn = ConnectionHandler.getConnection(root, 'TodoList_todos');
          if (conn && newEdge) {
            ConnectionHandler.insertEdgeBefore(conn, newEdge);
          }
        },

        onCompleted: () => {
          setText('');
        },

        onError: (error) => {
          console.error('Todo 추가 실패:', error);
        },
      });
    },
    [text, isInFlight, commitMutation]
  );

  return (
    <form className="todo-input-form" onSubmit={handleSubmit}>
      <input
        className="todo-input"
        type="text"
        placeholder="할 일을 입력하세요..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isInFlight}
      />
      <button
        className="todo-input-btn"
        type="submit"
        disabled={isInFlight || !text.trim()}
      >
        {isInFlight ? '추가 중...' : '추가'}
      </button>
    </form>
  );
}
