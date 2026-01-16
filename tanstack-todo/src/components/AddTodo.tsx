import { useState } from "react";

interface AddTodoProps {
  onAdd: (title: string) => void;
  isLoading?: boolean;
}

export function AddTodo({ onAdd, isLoading }: AddTodoProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="새로운 할 일을 입력하세요"
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={!title.trim() || isLoading}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "추가 중..." : "추가"}
      </button>
    </form>
  );
}
