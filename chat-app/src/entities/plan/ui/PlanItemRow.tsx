// C-10: 파일당 1 exported 컴포넌트
// T-11: 시맨틱 HTML + ARIA

import type { PlanItem } from '../model/types';

// ✅ T-13: named exported interface
export interface PlanItemRowProps {
  item: PlanItem;
  canEdit: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function PlanItemRow({ item, canEdit, onToggle, onDelete }: PlanItemRowProps) {
  return (
    <li className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 group">
      <label className="flex items-center gap-2 flex-1 cursor-pointer">
        <input
          type="checkbox"
          checked={item.isCompleted}
          onChange={onToggle}
          disabled={!canEdit}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className={item.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}>
          {item.content}
        </span>
      </label>
      {canEdit ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`${item.content} 삭제`}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-sm transition-opacity"
        >
          ✕
        </button>
      ) : null}
    </li>
  );
}
