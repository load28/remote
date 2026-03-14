// 레퍼런스: modal--portal--focus-management--a11y.md
// C-07: SRP — 초대 링크 생성/복사만 담당
// C-10: 파일당 1 exported 컴포넌트
// T-11: 시맨틱 HTML, N-03: on/handle, N-04: Boolean is 접두사

import { useState, useCallback } from 'react';
import { Modal } from '@/shared/components/Modal';
import type { InviteLink } from '../types';

// ✅ P-03: 모듈 레벨 상수
const COPY_SUCCESS_DURATION_MS = 2000;

// ✅ T-13: named exported interface
export interface InviteLinkModalProps {
  isOpen: boolean; // N-04
  channelName: string;
  inviteLink: InviteLink | null;
  isCreating: boolean; // N-04
  onClose: () => void; // N-03
  onCreateInvite: () => void; // N-03
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function InviteLinkModal({
  isOpen,
  channelName,
  inviteLink,
  isCreating,
  onClose,
  onCreateInvite,
}: InviteLinkModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  // ✅ N-03: handle 접두사
  const handleCopyLink = useCallback(async () => {
    if (!inviteLink) return;
    const url = `${window.location.origin}/invite/${inviteLink.code}`;
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), COPY_SUCCESS_DURATION_MS);
  }, [inviteLink]);

  const inviteUrl = inviteLink
    ? `${window.location.origin}/invite/${inviteLink.code}`
    : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`# ${channelName} 채널에 초대`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          초대 링크를 생성하여 비회원을 채널에 초대할 수 있습니다.
        </p>

        {inviteLink ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700"
                aria-label="초대 링크"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 whitespace-nowrap"
              >
                {isCopied ? '복사됨!' : '복사'}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              이 링크는 24시간 후 만료됩니다.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onCreateInvite}
            disabled={isCreating}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? '생성 중...' : '초대 링크 생성'}
          </button>
        )}
      </div>
    </Modal>
  );
}
