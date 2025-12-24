export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: MemberRole;
  boardId: string;
  joinedAt: string;
}

export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface InviteMemberDto {
  email: string;
  role: MemberRole;
}

export interface UpdateMemberRoleDto {
  role: MemberRole;
}

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export const MEMBER_ROLE_COLORS: Record<MemberRole, string> = {
  owner: '#8B5CF6',
  admin: '#3B82F6',
  member: '#22C55E',
  viewer: '#6B7280',
};
