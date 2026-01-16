import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import {
  getTodos,
  addTodo,
  toggleTodo,
  deleteTodo,
  updateTodo,
  type Todo,
} from "../server/todos";
import { AddTodo } from "../components/AddTodo";
import { TodoList } from "../components/TodoList";
import { TodoFilter, type FilterType } from "../components/TodoFilter";

export const Route = createFileRoute("/")({
  loader: async () => {
    const todos = await getTodos();
    return { todos };
  },
  component: HomePage,
});

function HomePage() {
  const { todos: initialTodos } = Route.useLoaderData();
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = useCallback(async (title: string) => {
    setIsLoading(true);
    try {
      const newTodo = await addTodo({ data: { title } });
      setTodos((prev) => [newTodo, ...prev]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleToggle = useCallback(async (id: string) => {
    try {
      const updatedTodo = await toggleTodo({ data: { id } });
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? updatedTodo : todo))
      );
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteTodo({ data: { id } });
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  }, []);

  const handleUpdate = useCallback(async (id: string, title: string) => {
    try {
      const updatedTodo = await updateTodo({ data: { id, title } });
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? updatedTodo : todo))
      );
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  }, []);

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const counts = {
    all: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            TanStack Todo
          </h1>
          <p className="text-gray-500">TanStack Start로 만든 투두 앱</p>
        </header>

        <div className="space-y-6">
          <AddTodo onAdd={handleAdd} isLoading={isLoading} />

          <div className="flex justify-between items-center">
            <TodoFilter
              filter={filter}
              onFilterChange={setFilter}
              counts={counts}
            />
          </div>

          <TodoList
            todos={filteredTodos}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />

          {todos.length > 0 && (
            <footer className="text-center text-sm text-gray-400 pt-4">
              더블클릭으로 수정 | 체크박스로 완료 표시
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
