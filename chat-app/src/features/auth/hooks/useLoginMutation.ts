// 레퍼런스: crud/hook--tanstack-query--abort.md
// S-04: TanStack Query useMutation 사용, S-17: onSuccess 내장 금지
// N-05: use + 동사

import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import type { LoginCredentials } from '../types';

// ✅ S-17: mutationFn만 정의, onSuccess는 사용처에서
export function useLoginMutation() {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
  });
}
