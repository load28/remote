'use client';

import { CategoryCard } from './CategoryCard';
import type { Category } from '@/shared/types';
import styles from './CategoryList.module.css';

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
