// 레퍼런스: tanstack-query--mutation--api-layer.md
// S-04: TanStack Query 사용, S-17: mutation 훅 onSuccess 내장 금지
// N-05: use + 동사

import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import type { ChangePasswordInput } from '../types';

// ✅ S-17: mutationFn만 정의, onSuccess는 사용처에서
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => authApi.changePassword(input),
  });
}
