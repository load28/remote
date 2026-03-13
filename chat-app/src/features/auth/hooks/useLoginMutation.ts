// 레퍼런스: crud/hook--tanstack-query--abort.md
// S-04: TanStack Query useMutation 사용 (수동 fetch 패턴 미사용)
// N-05: use + 동사

import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from './useAuthStore';
import type { LoginCredentials } from '../types';

export function useLoginMutation() {
  const signIn = useAuthStore((s) => s.signIn);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: ({ user, token }) => {
      signIn(user, token);
    },
  });
}
