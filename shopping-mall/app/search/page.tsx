'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { graphqlClient, SEARCH_PRODUCTS } from '@/shared/api';
import { ProductGrid } from '@/entities/product';
import { ProductCardSkeleton } from '@/entities/product';
import type { Product } from '@/shared/types';
import styles from './page.module.css';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const { data, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['search', debouncedQuery],
    queryFn: () =>
      graphqlClient.request(SEARCH_PRODUCTS, { search: `%${debouncedQuery}%` }),
    enabled: debouncedQuery.length >= 2,
  });

  const handleSearch = (value: string) => {
    setQuery(value);
    // Simple debounce
    setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
  };

  const clearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <ArrowLeft size={20} />
        </Link>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search products..."
            className={styles.searchInput}
            autoFocus
          />
          {query && (
            <button className={styles.clearBtn} onClick={clearSearch}>
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      <div className={styles.content}>
        {!debouncedQuery || debouncedQuery.length < 2 ? (
          <div className={styles.hint}>
            <p>Enter at least 2 characters to search</p>
          </div>
        ) : isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : data?.products.length ? (
          <>
            <p className={styles.resultCount}>
              {data.products.length} results for &quot;{debouncedQuery}&quot;
            </p>
            <ProductGrid products={data.products} />
          </>
        ) : (
          <div className={styles.noResults}>
            <p>No products found for &quot;{debouncedQuery}&quot;</p>
          </div>
        )}
      </div>
    </main>
  );
}
