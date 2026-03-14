// A-06: httpClient 래퍼만 import, SDK 직접 import 금지

import { httpClient } from '@/shared/lib/httpClient';
import type { InviteLink, CreateInviteInput, GuestJoinInput, GuestJoinResponse } from '../types';

// ✅ P-03: 모듈 레벨 타입
interface InviteInfoResponse {
  invite: InviteLink;
  channelName: string;
}

export const inviteApi = {
  create: (input: CreateInviteInput): Promise<InviteLink> =>
    httpClient.post('/api/invites', input),

  getByCode: (code: string, signal?: AbortSignal): Promise<InviteInfoResponse> =>
    httpClient.get(`/api/invites/${code}`, { signal }),

  joinAsGuest: (code: string, input: GuestJoinInput): Promise<GuestJoinResponse> =>
    httpClient.post(`/api/invites/${code}/join`, input),
};
