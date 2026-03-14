// S-04: TanStack Query 사용, S-17: mutation 훅 onSuccess 내장 금지
// N-05: use + 동사, P-13: signal abort

import { useQuery, useMutation } from '@tanstack/react-query';
import { inviteApi } from '../api/inviteApi';
import type { CreateInviteInput, GuestJoinInput } from '../types';

// ✅ P-03: 모듈 레벨 상수
export const INVITE_QUERY_KEY = ['invites'] as const;

// ✅ N-05: use + 동사
export function useInviteInfo(code: string | undefined) {
  return useQuery({
    queryKey: [...INVITE_QUERY_KEY, code],
    queryFn: ({ signal }) => inviteApi.getByCode(code!, signal),
    enabled: !!code,
  });
}

// ✅ S-17: mutationFn만 정의, onSuccess는 사용처에서
export function useCreateInvite() {
  return useMutation({
    mutationFn: (input: CreateInviteInput) => inviteApi.create(input),
  });
}

export function useJoinAsGuest(code: string) {
  return useMutation({
    mutationFn: (input: GuestJoinInput) => inviteApi.joinAsGuest(code, input),
  });
}
