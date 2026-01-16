import { useState } from "react";
import type { Todo } from "../server/todos";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onUpdate }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== todo.title) {
      onUpdate(todo.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <li className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 cursor-pointer"
      />

      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      ) : (
        <span
          className={`flex-1 cursor-pointer ${
            todo.completed ? "line-through text-gray-400" : "text-gray-700"
          }`}
          onDoubleClick={() => setIsEditing(true)}
        >
          {todo.title}
        </span>
      )}

      <div className="flex gap-2">
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-sm text-gray-600 hover:text-blue-500 transition-colors"
          >
            수정
          </button>
        )}
        <button
          onClick={() => onDelete(todo.id)}
          className="px-3 py-1 text-sm text-gray-600 hover:text-red-500 transition-colors"
        >
          삭제
        </button>
      </div>
    </li>
  );
}
