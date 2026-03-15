// 레퍼런스: interactive--event-naming--a11y.md
// C-07: SRP — 검색 입력 UI만 담당
// T-11: 시맨틱 HTML, N-03: on/handle

// ✅ T-13: named exported interface
export interface MessageSearchBarProps {
  searchQuery: string;
  onSearch: (query: string) => void; // N-03
  onClear: () => void; // N-03
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function MessageSearchBar({ searchQuery, onSearch, onClear }: MessageSearchBarProps) {
  // ✅ N-03: handle 접두사
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  return (
    <div className="px-6 py-2 border-b border-gray-100 bg-gray-50">
      <div className="relative">
        <input
          type="search"
          value={searchQuery}
          onChange={handleChange}
          placeholder="메시지 검색..."
          className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          aria-label="채널 메시지 검색"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        {/* ✅ P-04: 삼항 조건부 렌더 */}
        {searchQuery ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="검색어 지우기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
