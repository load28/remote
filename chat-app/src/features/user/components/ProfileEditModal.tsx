// 레퍼런스: modal--portal--focus-management--a11y.md, controlled--uncontrolled--discriminated-union.md
// C-07: SRP, S-13: controlled, T-11: 시맨틱 HTML, N-03: on/handle

import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '@/shared/components/Modal';
import type { User, UpdateProfileInput } from '../types';

// ✅ T-13: named exported interface
export interface ProfileEditModalProps {
  user: User;
  isOpen: boolean;                                       // N-04
  isSubmitting: boolean;                                 // N-04
  onClose: () => void;                                   // N-03
  onSubmitProfile: (input: UpdateProfileInput) => void;  // N-03
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function ProfileEditModal({
  user,
  isOpen,
  isSubmitting,
  onClose,
  onSubmitProfile,
}: ProfileEditModalProps) {
  // ✅ S-09: 로컬 UI 상태
  const [displayName, setDisplayName] = useState(user.displayName);
  const [statusMessage, setStatusMessage] = useState(user.statusMessage);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

  // 모달 열릴 때 현재 유저 정보로 초기화
  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.displayName);
      setStatusMessage(user.statusMessage);
      setAvatarUrl(user.avatarUrl);
    }
  }, [isOpen, user.displayName, user.statusMessage, user.avatarUrl]);

  // ✅ N-03: handle 접두사
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = displayName.trim();
    if (trimmedName.length === 0) return;
    onSubmitProfile({
      displayName: trimmedName,
      statusMessage: statusMessage.trim(),
      avatarUrl: avatarUrl.trim(),
    });
  };

  // ✅ N-04: has 접두사
  const hasValidInput = displayName.trim().length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="내 정보 수정">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 아바타 미리보기 */}
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt="프로필 미리보기"
            className="w-16 h-16 rounded-lg"
          />
          <div className="flex-1 min-w-0">
            <label htmlFor="profile-avatar" className="block text-sm font-medium text-gray-700 mb-1">
              아바타 URL
            </label>
            <input
              id="profile-avatar"
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-displayname" className="block text-sm font-medium text-gray-700 mb-1">
            표시 이름
          </label>
          <input
            id="profile-displayname"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="profile-status" className="block text-sm font-medium text-gray-700 mb-1">
            상태 메시지
          </label>
          <input
            id="profile-status"
            type="text"
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
            placeholder="상태 메시지를 입력하세요"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!hasValidInput || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
