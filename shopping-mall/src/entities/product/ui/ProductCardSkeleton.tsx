'use client';

import { Skeleton } from '@/shared/ui';
import styles from './ProductCardSkeleton.module.css';

export function ProductCardSkeleton() {
  return (
    <div className={styles.card}>
      <Skeleton className={styles.image} />
      <div className={styles.content}>
        <Skeleton height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton height={12} width="60%" borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton height={18} width="40%" borderRadius={4} />
      </div>
    </div>
  );
}
