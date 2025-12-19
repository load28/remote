'use client';

import { ProductCard } from './ProductCard';
import type { Product } from '@/shared/types';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
