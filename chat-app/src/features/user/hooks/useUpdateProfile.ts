// 레퍼런스: crud/hook--tanstack-query--abort.md
// S-04: TanStack Query 사용, N-05: use + 동사

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import type { UpdateProfileInput } from '../types';

// ✅ P-03: 모듈 레벨 상수
const USER_QUERY_KEY = ['users'] as const;

export function useUpdateProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => userApi.updateProfile(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
}
