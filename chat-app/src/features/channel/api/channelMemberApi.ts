// A-06: httpClient 래퍼만 import, SDK 직접 import 금지

import { httpClient } from '@/shared/lib/httpClient';
import type { ChannelMember, AddChannelMemberInput, UpdateMemberRoleInput } from '../types';

export const channelMemberApi = {
  getByChannel: (channelId: string, signal?: AbortSignal): Promise<ChannelMember[]> =>
    httpClient.get(`/api/channels/${channelId}/members`, { signal }),

  add: (channelId: string, input: AddChannelMemberInput): Promise<ChannelMember> =>
    httpClient.post(`/api/channels/${channelId}/members`, input),

  remove: (channelId: string, userId: string): Promise<void> =>
    httpClient.delete(`/api/channels/${channelId}/members/${userId}`),

  updateRole: (channelId: string, userId: string, input: UpdateMemberRoleInput): Promise<ChannelMember> =>
    httpClient.put(`/api/channels/${channelId}/members/${userId}/role`, input),
};
