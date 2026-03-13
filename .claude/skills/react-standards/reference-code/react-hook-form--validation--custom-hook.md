---
tags: [react-hook-form, form, validation, custom-hook, discriminated-union, generic]
rules: [S-13, T-13, T-14, N-05, A-05, A-09, C-04]
description: React Hook Form 폼 패턴 — Zod 스키마 검증 + 타입 안전 폼 + 커스텀 훅 분리
---

```tsx
// shared/lib/form.ts — React Hook Form + Zod 통합 래퍼 (A-09)
// ✅ react-hook-form을 직접 import하는 유일한 파일

import { useForm, UseFormReturn, UseFormProps, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';

// ✅ 제네릭 래퍼 — Zod 스키마만 전달하면 타입 추론 완료
export function useZodForm<T extends FieldValues>(
  schema: ZodSchema<T>,
  options?: Omit<UseFormProps<T>, 'resolver'>,
): UseFormReturn<T> {
  return useForm<T>({
    resolver: zodResolver(schema),
    ...options,
  });
}
```

```tsx
// {Feature}/schemas/{feature}Schema.ts — 검증 스키마 (A-05: 비즈니스 로직 분리)
// ✅ React import 없음 → 순수 스키마 → 서버/클라이언트 공용

import { z } from 'zod';

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, '이름은 2자 이상이어야 합니다')
    .max(50, '이름은 50자 이하여야 합니다'),
  email: z
    .string()
    .email('올바른 이메일 형식이 아닙니다'),
  role: z.enum(['admin', 'member', 'viewer']),
  bio: z.string().max(200).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

```tsx
// {Feature}/hooks/useCreateUserForm.ts — 폼 로직 커스텀 훅 (N-05)
// ✅ 폼 상태 + 제출 로직을 훅으로 분리 → 컴포넌트는 UI만 담당

import { useZodForm } from '@/shared/lib/form';
import { createUserSchema, CreateUserInput } from '../schemas/userSchema';
import { useCreateUser } from './useCreateUser'; // TanStack Query mutation

export function useCreateUserForm(onSuccess?: () => void) {
  const form = useZodForm(createUserSchema, {
    defaultValues: {
      name: '',
      email: '',
      role: 'member',
      bio: '',
    },
  });

  const createUser = useCreateUser();

  const handleSubmit = form.handleSubmit(async (input: CreateUserInput) => {
    await createUser.mutateAsync(input);
    form.reset();
    onSuccess?.();
  });

  return {
    form,
    handleSubmit,
    isSubmitting: createUser.isPending,
  };
}
```

```tsx
// {Feature}/components/CreateUserForm.tsx — UI 컴포넌트
// ✅ 컴포넌트는 렌더링만 담당 — 로직은 훅에 위임 (C-04: props 최소화)

import { useCreateUserForm } from '../hooks/useCreateUserForm';
import { FormField } from '@/shared/components/FormField';

export interface CreateUserFormProps {
  onSuccess?: () => void;
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const { form, handleSubmit, isSubmitting } = useCreateUserForm(onSuccess);
  const { register, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="이름" error={errors.name?.message}>
        <input {...register('name')} />
      </FormField>

      <FormField label="이메일" error={errors.email?.message}>
        <input type="email" {...register('email')} />
      </FormField>

      <FormField label="역할" error={errors.role?.message}>
        <select {...register('role')}>
          <option value="member">멤버</option>
          <option value="admin">관리자</option>
          <option value="viewer">뷰어</option>
        </select>
      </FormField>

      <FormField label="소개" error={errors.bio?.message}>
        <textarea {...register('bio')} />
      </FormField>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '생성 중...' : '사용자 생성'}
      </button>
    </form>
  );
}
```

```tsx
// shared/components/FormField.tsx — 재사용 폼 필드 래퍼
// ✅ 시맨틱 HTML + 접근성 (T-11)

export interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactElement;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div>
      <label>
        {label}
        {children}
      </label>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
```
