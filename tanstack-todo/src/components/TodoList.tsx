import type { Todo } from "../server/todos";
import { TodoItem } from "./TodoItem";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
}

export function TodoList({ todos, onToggle, onDelete, onUpdate }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">할 일이 없습니다</p>
        <p className="text-sm mt-1">새로운 할 일을 추가해보세요!</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </ul>
  );
}
