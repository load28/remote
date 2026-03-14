// N-01: PascalCase, N-03: on/handle, C-10: 파일당 1 exported, T-11: 시맨틱 HTML
// A-08: 단방향 데이터 흐름
// A-01: features → features 직접 참조 없음 — allUsers를 props로 주입

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChannelMembers, useAddChannelMember, useRemoveChannelMember, useUpdateMemberRole, CHANNEL_MEMBER_QUERY_KEY } from '../hooks/useChannelMembers';
import { ChannelMemberList } from './ChannelMemberList';
import type { ChannelAddableUser, ChannelMemberRole } from '../types';

// T-13: named exported interface
export interface ChannelMemberPanelProps {
  channelId: string;
  channelName: string;
  currentUserId: string;
  allUsers: ChannelAddableUser[]; // A-01: features/user 직접 참조 대신 props 주입
  onClose: () => void; // N-03
}

// C-10: 파일당 1 exported 컴포넌트
export function ChannelMemberPanel({
  channelId,
  channelName,
  currentUserId,
  allUsers,
  onClose,
}: ChannelMemberPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: members = [] } = useChannelMembers(channelId);
  const addMember = useAddChannelMember(channelId);
  const removeMember = useRemoveChannelMember(channelId);
  const updateRole = useUpdateMemberRole(channelId);

  // 파생값: 채널에 없는 유저만 필터 (직접 계산)
  const memberUserIds = new Set(members.map((m) => m.userId));
  const availableUsers = allUsers.filter(
    (user) =>
      !memberUserIds.has(user.id) &&
      (searchQuery === '' || user.displayName.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const invalidateMembers = () => {
    queryClient.invalidateQueries({ queryKey: [...CHANNEL_MEMBER_QUERY_KEY, channelId] });
  };

  // N-03: handle 접두사
  const handleClose = () => {
    onClose();
  };

  // S-17: onSuccess를 사용처에서 처리
  const handleAddMember = (userId: string) => {
    addMember.mutate(
      { userId, role: 'member' as ChannelMemberRole },
      { onSuccess: invalidateMembers },
    );
    setSearchQuery('');
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate(userId, { onSuccess: invalidateMembers });
  };

  const handleUpdateRole = (userId: string, role: ChannelMemberRole) => {
    updateRole.mutate({ userId, role }, { onSuccess: invalidateMembers });
  };

  return (
    // T-11: 시맨틱 HTML
    <aside className="w-80 border-l border-gray-200 bg-white flex flex-col h-full">
      <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          멤버 관리 — #{channelName}
        </h3>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="멤버 패널 닫기"
        >
          &times;
        </button>
      </header>

      <section className="px-4 py-3 border-b border-gray-100">
        <label htmlFor="member-search" className="block text-xs font-medium text-gray-500 mb-1">
          멤버 추가
        </label>
        <input
          id="member-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="사용자 검색..."
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {/* P-04: 삼항 조건부 렌더 */}
        {searchQuery.length > 0 ? (
          <ul className="mt-2 max-h-32 overflow-y-auto" role="listbox" aria-label="추가 가능한 사용자">
            {availableUsers.length > 0 ? (
              availableUsers.map((user) => (
                <li key={user.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => handleAddMember(user.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-indigo-50 rounded"
                  >
                    <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                    <span>{user.displayName}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-2 py-1.5 text-xs text-gray-400">검색 결과 없음</li>
            )}
          </ul>
        ) : null}
      </section>

      <section className="flex-1 overflow-y-auto px-2">
        <p className="px-2 py-2 text-xs text-gray-400">{members.length}명의 멤버</p>
        {members.length > 0 ? (
          <ChannelMemberList
            members={members}
            currentUserId={currentUserId}
            onRemoveMember={handleRemoveMember}
            onUpdateRole={handleUpdateRole}
          />
        ) : null}
      </section>
    </aside>
  );
}
