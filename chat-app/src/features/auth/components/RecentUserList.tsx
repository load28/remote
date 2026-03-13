// 레퍼런스: virtual-list--ref--memoization.md, startTransition--ref--debounce.md
// P-02: 50+ 리스트 가상화 적용
// C-03: 배열 인덱스 key 미사용 → user.id를 key로
// P-11: startTransition으로 필터링 비긴급 업데이트
// P-12: 빈번 변경값(검색 입력 시간) ref 저장

import { useRef, useState, startTransition, type ChangeEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { RecentUser } from '../types';

// ✅ P-03: 모듈 레벨 상수
const ITEM_HEIGHT = 48;
const LIST_HEIGHT = 240;
const OVERSCAN = 5;

// ✅ T-13: named exported interface
export interface RecentUserListProps {
  users: RecentUser[];
  onSelectUser: (username: string) => void;
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function RecentUserList({ users, onSelectUser }: RecentUserListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);
  // ✅ P-12: 렌더에 안 쓰이는 빈번 변경값
  const lastInputTimeRef = useRef(0);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredUsers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: OVERSCAN,
  });

  // ✅ N-03: handle 접두사
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    lastInputTimeRef.current = Date.now(); // P-12

    setSearchQuery(value); // 긴급: 입력 반영
    // ✅ P-11: 비긴급 — 필터링 결과 업데이트
    startTransition(() => {
      const query = value.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.username.toLowerCase().includes(query) ||
            u.displayName.toLowerCase().includes(query),
        ),
      );
    });
  };

  return (
    <div>
      <label htmlFor="user-search" className="block text-xs font-medium text-gray-500 mb-1">
        사용자 검색
      </label>
      <input
        id="user-search"
        type="search"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="이름 또는 사용자명 검색"
        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* ✅ P-02: 가상화 리스트 */}
      <div
        ref={parentRef}
        role="list"
        className="overflow-auto border border-gray-200 rounded-lg"
        style={{ height: LIST_HEIGHT }}
      >
        <div
          style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const user = filteredUsers[virtualRow.index];
            return (
              <button
                // ✅ C-03: 안정적 key (인덱스 아닌 id)
                key={user.id}
                type="button"
                role="listitem"
                onClick={() => onSelectUser(user.username)}
                className="absolute w-full flex items-center gap-2 px-3 hover:bg-gray-50 text-left"
                style={{
                  top: virtualRow.start,
                  height: virtualRow.size,
                }}
              >
                <img
                  src={user.avatarUrl}
                  alt={`${user.displayName} 프로필`}
                  className="w-7 h-7 rounded-full"
                />
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 truncate">{user.displayName}</p>
                  <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
