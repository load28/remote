'use client';

import { useQuery } from '@tanstack/react-query';
import { graphqlClient, GET_CATEGORIES } from '@/shared/api';
import type { Category } from '@/shared/types';

export function useCategories() {
  return useQuery<{ categories: Category[] }>({
    queryKey: ['categories'],
    queryFn: () => graphqlClient.request(GET_CATEGORIES),
  });
}
