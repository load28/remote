// S-18: URL 상태 수동 조작 금지 → nuqs 사용
// N-05: use + 동사
// 레퍼런스: nuqs--url-state--hook.md

import { useQueryStates } from 'nuqs';
import { messageSearchParams } from '../searchParams';

export function useMessageSearch() {
  const [search, setSearch] = useQueryStates(messageSearchParams, {
    history: 'replace',
  });

  // ✅ N-03: handle 접두사
  const handleSearch = (query: string) => {
    setSearch({ q: query });
  };

  const handleClearSearch = () => {
    setSearch(null);
  };

  return {
    searchQuery: search.q,
    handleSearch,
    handleClearSearch,
  };
}
