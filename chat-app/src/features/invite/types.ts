// T-13: named exported interface
// T-14: discriminated union으로 variant 타입 모델링

export interface InviteLink {
  id: string;
  channelId: string;
  code: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean; // N-04
}

export interface CreateInviteInput {
  channelId: string;
}

export interface GuestJoinInput {
  inviteCode: string;
  nickname: string;
}

export interface GuestJoinResponse {
  user: GuestUser;
  token: string;
  channelId: string;
}

export interface GuestUser {
  id: string;
  nickname: string;
  avatarUrl: string;
  isGuest: boolean; // N-04
}
