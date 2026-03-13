// S-04: TanStack Query 사용, N-05: use + 동사

import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/userApi';

const USER_QUERY_KEY = ['users'] as const;

export function useUsers() {
  return useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: ({ signal }) => userApi.getAll(signal),
  });
}
