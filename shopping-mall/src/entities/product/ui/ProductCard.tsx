'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { Badge } from '@/shared/ui';
import type { Product } from '@/shared/types';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const discountPercent = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <Link href={`/product/${product.id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {product.is_sale && discountPercent > 0 && (
          <Badge variant="sale" className={styles.saleBadge}>
            {discountPercent}% OFF
          </Badge>
        )}
        {product.stock === 0 && (
          <div className={styles.soldoutOverlay}>
            <span>Sold Out</span>
          </div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{product.name}</h3>
        <div className={styles.rating}>
          <Star size={12} fill="#ffd43b" stroke="#ffd43b" />
          <span>{product.rating}</span>
          <span className={styles.reviewCount}>({product.review_count})</span>
        </div>
        <div className={styles.priceWrapper}>
          <span className={styles.price}>${product.price.toFixed(2)}</span>
          {product.original_price && (
            <span className={styles.originalPrice}>
              ${product.original_price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
