---
tags: [form, controlled, mutation, zustand, client-state, interactive, api-layer]
rules: [S-01, S-08, S-13, T-13, N-03, N-04, N-05, C-07, C-10, A-02]
description: 사용자 정의 리소스 등록 — controlled 폼 + Zustand 클라이언트 리스트 관리 + 뮤테이션
---

```tsx
// {Feature}/types.ts — 사용자 정의 리소스 타입
export interface CustomResource {
  id: string;
  name: string;
  imageUrl: string;
  createdBy: string;
}

export interface CreateCustomResourceInput {
  name: string;
  imageUrl: string;
}
```

```tsx
// {Feature}/hooks/useCustomResourceStore.ts — Zustand 클라이언트 리스트 상태
import { create } from 'zustand';

// ✅ T-13: named exported interface
export interface CustomResourceStoreState {
  resources: CustomResource[];
}

export interface CustomResourceStoreActions {
  addResource: (resource: CustomResource) => void;
  removeResource: (id: string) => void;
}

// ✅ S-08: 클라이언트 상태 Zustand
// ✅ S-01: state 직접 변경 금지 → set()으로 새 참조
export const useCustomResourceStore = create<CustomResourceStoreState & CustomResourceStoreActions>()(
  (set) => ({
    resources: [],
    addResource: (resource) =>
      set((prev) => ({ resources: [...prev.resources, resource] })),
    removeResource: (id) =>
      set((prev) => ({
        resources: prev.resources.filter((r) => r.id !== id),
      })),
  }),
);
```

```tsx
// {Feature}/components/ResourceRegistrationForm.tsx
// ✅ C-07: 단일 책임 (리소스 등록 폼)
// ✅ S-13: controlled 컴포넌트

import { useState, type FormEvent } from 'react';

// ✅ T-13: named exported interface
export interface ResourceRegistrationFormProps {
  onSubmitResource: (input: CreateCustomResourceInput) => void;  // N-03
  isSubmitting: boolean;                                           // N-04
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function ResourceRegistrationForm({ onSubmitResource, isSubmitting }: ResourceRegistrationFormProps) {
  // ✅ S-09: 로컬 UI 상태
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // ✅ N-03: handle 접두사
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedUrl = imageUrl.trim();
    if (trimmedName.length === 0 || trimmedUrl.length === 0) return;
    onSubmitResource({ name: trimmedName, imageUrl: trimmedUrl });
    setName('');
    setImageUrl('');
  };

  // ✅ N-04: has 접두사
  const hasValidInput = name.trim().length > 0 && imageUrl.trim().length > 0;

  return (
    // ✅ T-11: 시맨틱 HTML — form 요소
    <form onSubmit={handleSubmit}>
      <label htmlFor="resource-name">이름</label>
      <input
        id="resource-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isSubmitting}
      />
      <label htmlFor="resource-url">이미지 URL</label>
      <input
        id="resource-url"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        disabled={isSubmitting}
      />
      <button type="submit" disabled={!hasValidInput || isSubmitting}>
        {isSubmitting ? '등록 중...' : '등록'}
      </button>
    </form>
  );
}
```
