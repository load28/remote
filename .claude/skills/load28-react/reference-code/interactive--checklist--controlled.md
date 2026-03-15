---
tags: [interactive, controlled, component]
rules: [C-04, C-05, C-07, C-10, N-03, N-04, P-03, P-04, T-11, T-13]
description: 체크리스트 UI 패턴 — 항목 토글, 추가, 삭제, 진행률 표시
---

# 체크리스트 UI 패턴

## 패널 컴포넌트 (조합)

```tsx
// {Feature}/components/EntityPanel.tsx
// C-07: 패널 조합만 담당
// C-04: props 7개 이하, 그룹화

export interface EntityPanelProps {
  entity: Entity;
  items: EntityItem[];
  currentUserId: string;
  permissions: EntityPermissions;
  onAction: EntityPanelActions;
}

export interface EntityPermissions {
  canAddItem: boolean;
  canDelete: boolean;
}

export interface EntityPanelActions {
  onAddItem: (content: string) => void;
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onClose: () => void;
  isAdding: boolean;
}

export function EntityPanel({
  entity,
  items,
  currentUserId,
  permissions,
  onAction,
}: EntityPanelProps) {
  const [newItemContent, setNewItemContent] = useState('');
  const progress = calculateProgress(items);

  const handleSubmitItem = () => {
    const trimmed = newItemContent.trim();
    if (!trimmed) return;
    onAction.onAddItem(trimmed);
    setNewItemContent('');
  };

  return (
    <aside aria-label="체크리스트 패널">
      <header>
        <h2>{entity.title}</h2>
        <button type="button" onClick={onAction.onClose} aria-label="닫기">
          ×
        </button>
      </header>

      {/* P-04: 삼항 조건부 렌더 */}
      {items.length > 0 ? (
        <div role="progressbar" aria-valuenow={progress.percentage}>
          {progress.completed}/{progress.total} ({progress.percentage}%)
        </div>
      ) : null}

      <ul role="list">
        {items.map((item) => (
          <EntityItemRow
            key={item.id}
            item={item}
            canEdit={true}
            onToggle={() => onAction.onToggleItem(item.id)}
            onDelete={() => onAction.onDeleteItem(item.id)}
          />
        ))}
      </ul>

      {permissions.canAddItem ? (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmitItem(); }}>
          <input
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            aria-label="새 항목"
            disabled={onAction.isAdding}
          />
          <button type="submit" disabled={onAction.isAdding || !newItemContent.trim()}>
            추가
          </button>
        </form>
      ) : null}
    </aside>
  );
}
```

## 항목 행 (C-10: 파일당 1 exported — 별도 파일)

```tsx
// {Feature}/components/EntityItemRow.tsx
// T-13: named exported interface
export interface EntityItemRowProps {
  item: EntityItem;
  canEdit: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function EntityItemRow({ item, canEdit, onToggle, onDelete }: EntityItemRowProps) {
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={item.isCompleted}
          onChange={onToggle}
          disabled={!canEdit}
        />
        <span>{item.content}</span>
      </label>
      {canEdit ? (
        <button type="button" onClick={onDelete} aria-label={`${item.content} 삭제`}>
          삭제
        </button>
      ) : null}
    </li>
  );
}
```
