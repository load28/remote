export type FilterType = "all" | "active" | "completed";

interface TodoFilterProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: {
    all: number;
    active: number;
    completed: number;
  };
}

export function TodoFilter({ filter, onFilterChange, counts }: TodoFilterProps) {
  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "active", label: "진행 중" },
    { key: "completed", label: "완료" },
  ];

  return (
    <div className="flex gap-2">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === key
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {label} ({counts[key]})
        </button>
      ))}
    </div>
  );
}
