import { createServerFn } from "@tanstack/react-start";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

// In-memory storage
const todos: Map<string, Todo> = new Map([
  [
    "1",
    {
      id: "1",
      title: "TanStack Start 배우기",
      completed: false,
      createdAt: new Date().toISOString(),
    },
  ],
  [
    "2",
    {
      id: "2",
      title: "투두 앱 만들기",
      completed: true,
      createdAt: new Date().toISOString(),
    },
  ],
]);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const getTodos = createServerFn({ method: "GET" }).handler(async () => {
  return Array.from(todos.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

export const addTodo = createServerFn({ method: "POST" })
  .inputValidator((data: { title: string }) => data)
  .handler(async ({ data }) => {
    const id = generateId();
    const todo: Todo = {
      id,
      title: data.title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    todos.set(id, todo);
    return todo;
  });

export const toggleTodo = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const todo = todos.get(data.id);
    if (!todo) {
      throw new Error("Todo not found");
    }
    todo.completed = !todo.completed;
    todos.set(data.id, todo);
    return todo;
  });

export const deleteTodo = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const deleted = todos.delete(data.id);
    if (!deleted) {
      throw new Error("Todo not found");
    }
    return { success: true };
  });

export const updateTodo = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; title: string }) => data)
  .handler(async ({ data }) => {
    const todo = todos.get(data.id);
    if (!todo) {
      throw new Error("Todo not found");
    }
    todo.title = data.title;
    todos.set(data.id, todo);
    return todo;
  });
