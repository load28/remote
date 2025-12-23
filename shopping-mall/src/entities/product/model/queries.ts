'use client';

import { useQuery } from '@tanstack/react-query';
import { graphqlClient, GET_PRODUCTS, GET_FEATURED_PRODUCTS, GET_SALE_PRODUCTS, GET_PRODUCT_BY_ID, GET_PRODUCTS_BY_CATEGORY } from '@/shared/api';
import type { Product } from '@/shared/types';

interface ProductsResponse {
  products: Product[];
  products_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export function useProducts(categorySlug?: string, limit = 20, offset = 0) {
  return useQuery<ProductsResponse>({
    queryKey: ['products', categorySlug, limit, offset],
    queryFn: async () => {
      if (categorySlug) {
        return graphqlClient.request(GET_PRODUCTS_BY_CATEGORY, {
          categorySlug,
          limit,
          offset,
        });
      }
      return graphqlClient.request(GET_PRODUCTS, {
        limit,
        offset,
        where: {},
      });
    },
  });
}

export function useFeaturedProducts() {
  return useQuery<{ products: Product[] }>({
    queryKey: ['featuredProducts'],
    queryFn: () => graphqlClient.request(GET_FEATURED_PRODUCTS),
  });
}

export function useSaleProducts() {
  return useQuery<{ products: Product[] }>({
    queryKey: ['saleProducts'],
    queryFn: () => graphqlClient.request(GET_SALE_PRODUCTS),
  });
}

export function useProduct(id: number) {
  return useQuery<{ products_by_pk: Product }>({
    queryKey: ['product', id],
    queryFn: () => graphqlClient.request(GET_PRODUCT_BY_ID, { id }),
    enabled: !!id,
  });
}
