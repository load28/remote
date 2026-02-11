import { useState, useMemo, useCallback } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

/**
 * TodoList 컴포넌트.
 * 다양한 hook 패턴과 파생 상태(derived state)를 포함.
 * React Compiler의 분석이 얼마나 세밀하게 동작하는지 확인하기 위한 예제.
 *
 * - useMemo: 기존 수동 메모이제이션 → 컴파일러가 보존 or 최적화
 * - useCallback: 콜백 메모이제이션
 * - 조건부 렌더링: reactive scope 분리
 */
export function TodoList({ filter }: { filter: string }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  const filteredTodos = useMemo(
    () => todos.filter((t) => t.text.includes(filter)),
    [todos, filter],
  );

  const completedCount = filteredTodos.filter((t) => t.completed).length;
  const totalCount = filteredTodos.length;

  const addTodo = useCallback(() => {
    if (input.trim()) {
      setTodos((prev) => [...prev, { id: Date.now(), text: input, completed: false }]);
      setInput('');
    }
  }, [input]);

  const toggleTodo = useCallback(
    (id: number) => {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    },
    [],
  );

  return (
    <div>
      <h1>
        Todos ({completedCount}/{totalCount})
      </h1>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <ul>
        {filteredTodos.map((todo) => (
          <li key={todo.id} onClick={() => toggleTodo(todo.id)}>
            {todo.completed ? '✅' : '⬜'} {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
