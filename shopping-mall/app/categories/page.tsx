'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useCategories } from '@/entities/category';
import { Skeleton } from '@/shared/ui';
import styles from './page.module.css';

export default function CategoriesPage() {
  const { data, isLoading } = useCategories();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className={styles.title}>Categories</h1>
        <div className={styles.placeholder} />
      </header>

      <div className={styles.grid}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <Skeleton height={120} borderRadius={12} />
                <Skeleton height={16} width="60%" borderRadius={4} />
              </div>
            ))
          : data?.categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className={styles.card}
              >
                <div className={styles.imageWrapper}>
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
                <h3 className={styles.name}>{category.name}</h3>
              </Link>
            ))}
      </div>
    </main>
  );
}
