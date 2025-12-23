'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/shared/types';
import styles from './CategoryCard.module.css';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/category/${category.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={category.image_url}
          alt={category.name}
          fill
          className={styles.image}
          sizes="80px"
        />
      </div>
      <span className={styles.name}>{category.name}</span>
    </Link>
  );
}
