---
tags: [jotai, derived-atom, client-state]
rules: [S-03, S-08, N-09, T-04]
description: Jotai 파생 atom 체인 패턴 — derived atom 조합으로 선언적 의존 그래프
---

```ts
// {layer}/{slice}/model/{feature}Atoms.ts — derived atom 체인

import { atom } from 'jotai';

// ── 도메인 타입 ─────────────────────────────────────────
interface Entity {
  id: string;
  name: string;
  category: string;
}

// ── Primitive atoms (원본 상태) ──────────────────────────
export const entityListAtom = atom<Entity[]>([]);
export const filterKeywordAtom = atom<string>('');
export const selectedCategoryAtom = atom<string | null>(null);

// ── Derived atoms (파생 — read-only) ────────────────────
// ✅ S-03: 파생 가능한 값은 state로 저장하지 않는다 → derived atom으로 대체
// ✅ N-09: ___Atom 접미사

// 1단계 파생: 카테고리 필터링
export const filteredByCategoryAtom = atom((get) => {
  const entities = get(entityListAtom);
  const category = get(selectedCategoryAtom);
  return category === null
    ? entities
    : entities.filter((e) => e.category === category);
});

// 2단계 파생: 키워드 필터링 (1단계 결과 기반)
export const filteredEntitiesAtom = atom((get) => {
  const filtered = get(filteredByCategoryAtom);
  const keyword = get(filterKeywordAtom).toLowerCase();
  return keyword === ''
    ? filtered
    : filtered.filter((e) => e.name.toLowerCase().includes(keyword));
});

// 3단계 파생: 카운트 (2단계 결과 기반)
export const filteredCountAtom = atom((get) => get(filteredEntitiesAtom).length);

// ── 의존 그래프 ─────────────────────────────────────────
//
//  entityListAtom ──┐
//                    ├─→ filteredByCategoryAtom ──┐
//  selectedCategoryAtom ┘                         │
//                                                 ├─→ filteredEntitiesAtom ──→ filteredCountAtom
//  filterKeywordAtom ─────────────────────────────┘
//
// 각 derived atom은 의존하는 atom이 변경될 때만 재계산된다.
// 불필요한 state 중복 없이 선언적으로 데이터 흐름을 표현한다.
```

```tsx
// ✅ Consumer: derived atom도 useAtomValue로 읽기만 구독

import { useAtomValue } from 'jotai';
import { filteredEntitiesAtom, filteredCountAtom } from '../model/entityAtoms';

function EntityList() {
  const entities = useAtomValue(filteredEntitiesAtom);
  // entities는 카테고리 + 키워드 필터가 적용된 결과
  // 원본 entityListAtom이나 필터 조건이 변경되면 자동 재계산
  return (
    <ul>
      {entities.map((entity) => (
        <li key={entity.id}>{entity.name}</li>
      ))}
    </ul>
  );
}

function EntityCount() {
  // ✅ 카운트만 필요하면 filteredCountAtom만 구독
  // filteredEntitiesAtom의 배열 참조가 바뀌어도 length가 같으면 리렌더 없음
  const count = useAtomValue(filteredCountAtom);
  return <span>{count}건</span>;
}

// ❌ BAD: 파생 가능한 값을 useState로 저장 → S-03 위반
// function EntityList() {
//   const entities = useAtomValue(entityListAtom);
//   const keyword = useAtomValue(filterKeywordAtom);
//   const [filtered, setFiltered] = useState(entities);
//   useEffect(() => {
//     setFiltered(entities.filter((e) => e.name.includes(keyword)));
//   }, [entities, keyword]);
//   // → derived atom으로 대체하면 상태 중복·동기화 문제 제거
// }
```
