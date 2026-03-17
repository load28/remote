// 레퍼런스: interactive--event-naming--a11y.md, jotai--atom--client-state.md
// C-07: SRP — 게스트 입장 폼
// C-10: 파일당 1 exported 컴포넌트
// S-13: controlled 컴포넌트
// T-11: 시맨틱 HTML

import { useState, type FormEvent } from 'react';

// ✅ T-13: named exported interface
export interface GuestJoinPageProps {
  channelName: string;
  isLoading: boolean; // N-04
  isJoining: boolean; // N-04
  isError: boolean; // N-04
  errorMessage: string;
  onJoin: (nickname: string) => void; // N-03
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function GuestJoinPage({
  channelName,
  isLoading,
  isJoining,
  isError,
  errorMessage,
  onJoin,
}: GuestJoinPageProps) {
  // ✅ S-09: 로컬 UI 상태
  const [nickname, setNickname] = useState('');

  // ✅ N-03: handle 접두사
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length === 0) return;
    onJoin(trimmedNickname);
  };

  // ✅ N-04: has 접두사
  const hasValidInput = nickname.trim().length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500">초대 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50" role="alert">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">초대 링크 오류</h1>
          <p className="text-gray-500">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-lg">
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">채널 초대</h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-semibold text-indigo-600">#{channelName}</span> 채널에 초대되었습니다
          </p>
        </header>

        {/* ✅ T-11: 시맨틱 HTML — form 요소 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="guest-nickname" className="block text-sm font-medium text-gray-700 mb-1">
              닉네임
            </label>
            <input
              id="guest-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="채팅에서 사용할 닉네임"
              disabled={isJoining}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!hasValidInput || isJoining}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? '입장 중...' : '게스트로 입장'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          게스트는 초대된 채널에서만 대화할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
