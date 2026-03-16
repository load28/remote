// 레퍼런스: interactive--event-naming--a11y.md, modal--portal--focus-management--a11y.md
// C-07: SRP — 채널 헤더 표시 + 초대 기능
// C-10: 파일당 1 exported 컴포넌트
// T-11: 시맨틱 HTML, N-03: on/handle, N-04: Boolean is 접두사

import { useState } from 'react';
import { InviteLinkModal, useCreateInvite } from '@/features/invite';
import type { InviteLink } from '@/features/invite';
import type { Channel } from '@/features/channel';
import { NotificationBell } from '@/features/notification';

// ✅ T-13: named exported interface
export interface ChatChannelHeaderProps {
  selectedChannel: Channel | undefined;
  isGuest: boolean; // N-04
  unreadNotificationCount: number;
  onToggleMemberPanel: () => void; // N-03
  onToggleNotificationPanel: () => void; // N-03
  onToggleExportPanel: () => void; // N-03
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function ChatChannelHeader({ selectedChannel, isGuest, unreadNotificationCount, onToggleMemberPanel, onToggleNotificationPanel, onToggleExportPanel }: ChatChannelHeaderProps) {
  // ✅ S-09: 사용처 가까이 배치
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [currentInviteLink, setCurrentInviteLink] = useState<InviteLink | null>(null);
  const createInvite = useCreateInvite();

  // ✅ N-03: handle 접두사
  const handleOpenInviteModal = () => {
    setCurrentInviteLink(null);
    setIsInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
    setCurrentInviteLink(null);
  };

  // ✅ S-17: onSuccess를 사용처에서 처리
  const handleCreateInvite = () => {
    if (!selectedChannel) return;
    createInvite.mutate({ channelId: selectedChannel.id }, {
      onSuccess: (invite) => {
        setCurrentInviteLink(invite);
      },
    });
  };

  return (
    <>
      <header className="px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedChannel ? `# ${selectedChannel.name}` : '채널을 선택하세요'}
          </h2>
          {selectedChannel ? (
            <p className="text-sm text-gray-500">{selectedChannel.description}</p>
          ) : null}
        </div>
        {/* 게스트가 아닐 때만 초대/멤버 버튼 표시 */}
        {selectedChannel && !isGuest ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMemberPanel}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              aria-label={`${selectedChannel.name} 채널 멤버 관리`}
            >
              멤버 {selectedChannel.memberCount}
            </button>
            <button
              type="button"
              onClick={handleOpenInviteModal}
              className="px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50"
              aria-label={`${selectedChannel.name} 채널에 초대`}
            >
              초대하기
            </button>
            <button
              type="button"
              onClick={onToggleExportPanel}
              className="px-3 py-1.5 text-sm font-medium text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50"
              aria-label="대회 Export"
            >
              Export
            </button>
            <NotificationBell unreadCount={unreadNotificationCount} onTogglePanel={onToggleNotificationPanel} />
          </div>
        ) : null}
      </header>

      {selectedChannel ? (
        <InviteLinkModal
          isOpen={isInviteModalOpen}
          channelName={selectedChannel.name}
          inviteLink={currentInviteLink}
          isCreating={createInvite.isPending}
          onClose={handleCloseInviteModal}
          onCreateInvite={handleCreateInvite}
        />
      ) : null}
    </>
  );
}
