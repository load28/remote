// 레퍼런스: presentational--discriminated-union--semantic-html.md
// C-07: SRP, T-11: 시맨틱 HTML, N-04: Boolean is 접두사

import type { User } from '../types';

// ✅ T-13: named exported interface
export interface UserProfileProps {
  user: User;
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
      <div className="relative">
        <img
          src={user.avatarUrl}
          alt={`${user.displayName} 프로필`}
          className="w-8 h-8 rounded-lg"
        />
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-50 ${
            user.isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
          aria-label={user.isOnline ? '온라인' : '오프라인'}
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
        <p className="text-xs text-gray-500 truncate">@{user.username}</p>
      </div>
    </div>
  );
}
