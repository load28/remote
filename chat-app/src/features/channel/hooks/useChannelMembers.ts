// S-04: TanStack Query 사용, S-17: mutation 훅 onSuccess 내장 금지
// N-05: use + 동사, P-13: signal abort

import { useQuery, useMutation } from '@tanstack/react-query';
import { channelMemberApi } from '../api/channelMemberApi';
import type { AddChannelMemberInput, UpdateMemberRoleInput } from '../types';

// P-03: 모듈 레벨 상수
export const CHANNEL_MEMBER_QUERY_KEY = ['channel-members'] as const;

// P-13: signal abort
export function useChannelMembers(channelId: string) {
  return useQuery({
    queryKey: [...CHANNEL_MEMBER_QUERY_KEY, channelId],
    queryFn: ({ signal }) => channelMemberApi.getByChannel(channelId, signal),
    enabled: !!channelId,
  });
}

// S-17: mutationFn만, onSuccess는 사용처에서
export function useAddChannelMember(channelId: string) {
  return useMutation({
    mutationFn: (input: AddChannelMemberInput) => channelMemberApi.add(channelId, input),
  });
}

export function useRemoveChannelMember(channelId: string) {
  return useMutation({
    mutationFn: (userId: string) => channelMemberApi.remove(channelId, userId),
  });
}

export function useUpdateMemberRole(channelId: string) {
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UpdateMemberRoleInput['role'] }) =>
      channelMemberApi.updateRole(channelId, userId, { role }),
  });
}
