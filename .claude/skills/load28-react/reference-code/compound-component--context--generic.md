---
tags: [compound-component, context, generic, component, useMemo, a11y]
rules: [C-09]
description: Compound Component — 제네릭 DataTable 합성 패턴 + 사용 예시
---

```tsx
// shared/components/DataTable/DataTable.tsx

import { createContext, useContext, useMemo } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';

// ✅ 제네릭 Compound Component — 어떤 데이터 타입이든 적용 가능

interface DataTableContextValue<T> {
  data: T[];
  sortField: string | null;
  onSort: (field: string) => void;
}

const DataTableContext = createContext<DataTableContextValue<unknown> | null>(null);

function useDataTable<T>() {
  const ctx = useContext(DataTableContext) as DataTableContextValue<T> | null;
  if (!ctx) throw new Error('DataTable compounds must be within <DataTable>');
  return ctx;
}

// Root
export interface DataTableProps<T> extends PropsWithChildren {
  data: T[];
  sortField?: string | null;
  onSort?: (field: string) => void;
}

export function DataTable<T>({ data, sortField = null, onSort, children }: DataTableProps<T>) {
  const value = useMemo(
    () => ({ data, sortField, onSort: onSort ?? (() => {}) }),
    [data, sortField, onSort],
  );

  return (
    <DataTableContext.Provider value={value}>
      <table role="grid">{children}</table>
    </DataTableContext.Provider>
  );
}

// Header
function Header({ children }: PropsWithChildren) {
  return <thead><tr>{children}</tr></thead>;
}

// Column
interface ColumnProps {
  field: string;
  label: string;
  isSortable?: boolean;
}

function Column({ field, label, isSortable = false }: ColumnProps) {
  const { sortField, onSort } = useDataTable();
  const isActive = sortField === field;

  return (
    <th
      scope="col"
      aria-sort={isActive ? 'ascending' : undefined}
      onClick={isSortable ? () => onSort(field) : undefined}
      style={isSortable ? { cursor: 'pointer' } : undefined}
    >
      {label}
      {isActive ? ' ↑' : ''}
    </th>
  );
}

// Body
interface BodyProps<T> {
  renderRow: (item: T, index: number) => ReactNode;
}

function Body<T>({ renderRow }: BodyProps<T>) {
  const { data } = useDataTable<T>();
  return <tbody>{data.map((item, i) => renderRow(item, i))}</tbody>;
}

// 합성 패턴 노출
DataTable.Header = Header;
DataTable.Column = Column;
DataTable.Body = Body;
```

```tsx
<DataTable data={users} sortField={sortBy} onSort={setSortBy}>
  <DataTable.Header>
    <DataTable.Column field="name" label="이름" isSortable />
    <DataTable.Column field="email" label="이메일" />
    <DataTable.Column field="role" label="역할" isSortable />
  </DataTable.Header>
  <DataTable.Body renderRow={(user) => (
    <tr key={user.id}>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>{user.role}</td>
    </tr>
  )} />
</DataTable>
```
