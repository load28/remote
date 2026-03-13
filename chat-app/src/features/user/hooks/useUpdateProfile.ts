// 레퍼런스: crud/hook--tanstack-query--abort.md
// S-04: TanStack Query 사용, S-17: mutation 훅 onSuccess 내장 금지
// N-05: use + 동사

import { useMutation } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import type { UpdateProfileInput } from '../types';

// ✅ S-17: mutationFn만 정의, onSuccess는 사용처에서
export function useUpdateProfile(userId: string) {
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => userApi.updateProfile(userId, input),
  });
}
