"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

export function TodoList() {
  const { data: todos } = useSuspenseQuery<Todo[]>({
    queryKey: ["todos"],
    queryFn: async () => {
      // 서스펜스 동작 확인을 위해 인위적 지연 추가
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const res = await fetch(
        "https://jsonplaceholder.typicode.com/todos?_limit=10"
      );
      if (!res.ok) throw new Error("Failed to fetch todos");
      return res.json();
    },
  });

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {todos.map((todo) => (
        <li
          key={todo.id}
          style={{
            padding: "12px 16px",
            marginBottom: "8px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            opacity: todo.completed ? 0.6 : 1,
          }}
        >
          <span style={{ marginRight: "8px" }}>
            {todo.completed ? "✅" : "⬜"}
          </span>
          {todo.title}
        </li>
      ))}
    </ul>
  );
}
