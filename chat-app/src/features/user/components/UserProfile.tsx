// 레퍼런스: presentational--discriminated-union--semantic-html.md, interactive--event-naming--a11y.md
// C-07: SRP, T-11: 시맨틱 HTML, N-04: Boolean is 접두사, N-03: on/handle

import type { User } from '../types';

// ✅ T-13: named exported interface
export interface UserProfileProps {
  user: User;
  onEditProfile: () => void;         // N-03: on 접두사
  onChangePassword: () => void;      // N-03: on 접두사
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function UserProfile({ user, onEditProfile, onChangePassword }: UserProfileProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-700 bg-gray-800">
      <div className="relative">
        <img
          src={user.avatarUrl}
          alt={`${user.displayName} 프로필`}
          className="w-8 h-8 rounded-lg"
        />
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${
            user.isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
          aria-label={user.isOnline ? '온라인' : '오프라인'}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-100 truncate">{user.displayName}</p>
        {user.statusMessage ? (
          <p className="text-xs text-gray-400 truncate">{user.statusMessage}</p>
        ) : (
          <p className="text-xs text-gray-500 truncate">@{user.username}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onChangePassword}
        className="text-gray-400 hover:text-gray-200 p-1 rounded transition-colors"
        aria-label="비밀번호 변경"
        title="비밀번호 변경"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onEditProfile}
        className="text-gray-400 hover:text-gray-200 p-1 rounded transition-colors"
        aria-label="내 정보 수정"
        title="내 정보 수정"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
    </div>
  );
}
