'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProductGrid, useProducts } from '@/entities/product';
import { ProductCardSkeleton } from '@/entities/product';
import styles from './page.module.css';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const { data, isLoading } = useProducts(resolvedParams.slug);

  const categoryName = resolvedParams.slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className={styles.title}>{categoryName}</h1>
        <div className={styles.placeholder} />
      </header>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : data?.products.length ? (
          <>
            <p className={styles.count}>
              {data.products_aggregate?.aggregate?.count || data.products.length} products
            </p>
            <ProductGrid products={data.products} />
          </>
        ) : (
          <div className={styles.empty}>
            <p>No products found in this category</p>
          </div>
        )}
      </div>
    </main>
  );
}
