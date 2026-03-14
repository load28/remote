// N-01: PascalCase, N-03: on/handle, C-10: 파일당 1 exported, T-11: 시맨틱 HTML

import type { ChannelMember, ChannelMemberRole } from '../types';

// P-03: 모듈 레벨 상수
const ROLE_LABELS: Record<ChannelMemberRole, string> = {
  owner: '소유자',
  admin: '관리자',
  member: '멤버',
};

const ROLE_ORDER: Record<ChannelMemberRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
};

// T-13: named exported interface
export interface ChannelMemberListProps {
  members: ChannelMember[];
  currentUserId: string;
  onRemoveMember: (userId: string) => void; // N-03
  onUpdateRole: (userId: string, role: ChannelMemberRole) => void; // N-03
}

// C-10: 파일당 1 exported 컴포넌트
export function ChannelMemberList({
  members,
  currentUserId,
  onRemoveMember,
  onUpdateRole,
}: ChannelMemberListProps) {
  // 파생값: 역할 순서로 정렬 (직접 계산, S-02/S-03)
  const sortedMembers = [...members].sort(
    (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role],
  );

  const currentMember = members.find((m) => m.userId === currentUserId);
  const isCurrentOwnerOrAdmin =
    currentMember?.role === 'owner' || currentMember?.role === 'admin';

  // N-03: handle 접두사
  const handleRemoveMember = (userId: string) => {
    onRemoveMember(userId);
  };

  const handleUpdateRole = (userId: string, role: ChannelMemberRole) => {
    onUpdateRole(userId, role);
  };

  return (
    // T-11: 시맨틱 HTML
    <ul className="divide-y divide-gray-100" role="list" aria-label="채널 멤버 목록">
      {sortedMembers.map((member) => {
        const isCurrentUser = member.userId === currentUserId;
        const isOwner = member.role === 'owner'; // N-04

        return (
          <li key={member.userId} className="flex items-center gap-3 py-3 px-2">
            <div className="relative">
              <img
                src={member.avatarUrl}
                alt={`${member.displayName} 프로필`}
                className="w-8 h-8 rounded-full"
              />
              {member.isOnline ? (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" aria-label="온라인" />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {member.displayName}
                {isCurrentUser ? (
                  <span className="ml-1 text-xs text-gray-400">(나)</span>
                ) : null}
              </p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[member.role]}</p>
            </div>
            {/* P-04: 삼항 조건부 렌더 */}
            {isCurrentOwnerOrAdmin && !isCurrentUser && !isOwner ? (
              <div className="flex items-center gap-1">
                <select
                  value={member.role}
                  onChange={(e) => handleUpdateRole(member.userId, e.target.value as ChannelMemberRole)}
                  className="text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-600"
                  aria-label={`${member.displayName} 역할 변경`}
                >
                  <option value="admin">관리자</option>
                  <option value="member">멤버</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.userId)}
                  className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5"
                  aria-label={`${member.displayName} 제거`}
                >
                  제거
                </button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
