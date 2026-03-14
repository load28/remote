---
tags: [interactive, component, event-naming, a11y, semantic-html]
rules: [N-03, N-04, C-04, T-11]
description: 인터랙티브 컴포넌트 — on/handle 이벤트 네이밍 + 시맨틱 HTML
---

```tsx
// shared/components/ActionCard.tsx

export interface ActionCardProps {
  title: string;
  description: string;
  isDisabled: boolean;           // ✅ Boolean: is 접두사 (N-04)
  onAction: () => void;          // ✅ props 이벤트: on 접두사 (N-03)
  onDismiss: () => void;
}

export function ActionCard({
  title,
  description,
  isDisabled,
  onAction,
  onDismiss,
}: ActionCardProps) {
  // ✅ 내부 핸들러: handle 접두사 (N-03)
  const handleAction = () => {
    if (!isDisabled) onAction();
  };

  return (
    <article aria-labelledby="card-title">
      <h3 id="card-title">{title}</h3>
      <p>{description}</p>
      <footer>
        {/* ✅ 시맨틱 HTML (T-11) */}
        <button onClick={onDismiss} type="button">닫기</button>
        <button onClick={handleAction} disabled={isDisabled} type="button">
          실행
        </button>
      </footer>
    </article>
  );
}
```
