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
