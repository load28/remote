---
tags: [key-reset, state, hook, component]
rules: [C-12]
description: key 기반 컨텍스트 전환 — key prop으로 컴포넌트 상태 완전 리셋
---

```tsx
// ✅ 범용 패턴: 엔티티 전환 시 key로 전체 상태 리셋

interface DetailPageProps {
  entityId: string;
}

// 부모: key로 인스턴스 완전 교체
function DetailPageWrapper() {
  const { entityId } = useParams<{ entityId: string }>();
  // entityId 변경 → DetailView 완전 새 인스턴스
  return <DetailView key={entityId} entityId={entityId!} />;
}

// 자식: 깨끗한 초기 상태에서 시작 — useEffect 리셋 체인 불필요
function DetailView({ entityId }: DetailPageProps) {
  const [editBuffer, setEditBuffer] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { data } = useEntityById(entityId);
  // entityId 전환 시 editBuffer='', isEditing=false로 자동 리셋
  return ( /* ... */ );
}
```
