// T-13: named exported interface

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  isPrivate: boolean; // N-04
  memberCount: number;
  createdAt: string;
}

export interface CreateChannelInput {
  name: string;
  description: string;
  isPrivate: boolean;
}

// --- Channel Member Types ---

export type ChannelMemberRole = 'owner' | 'admin' | 'member';

// T-13: named exported interface
export interface ChannelMember {
  channelId: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean; // N-04
  role: ChannelMemberRole;
  joinedAt: string;
}

export interface AddChannelMemberInput {
  userId: string;
  role: ChannelMemberRole;
}

export interface UpdateMemberRoleInput {
  role: ChannelMemberRole;
}
