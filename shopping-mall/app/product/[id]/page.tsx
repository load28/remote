'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star, Minus, Plus, ShoppingCart, Heart } from 'lucide-react';
import { useProduct } from '@/entities/product';
import { useCart } from '@/entities/cart';
import { Button, Badge, Skeleton } from '@/shared/ui';
import { useState } from 'react';
import styles from './page.module.css';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = use(params);
  const productId = parseInt(resolvedParams.id);
  const { data, isLoading } = useProduct(productId);
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.imageContainer}>
          <Skeleton height={400} />
        </div>
        <div className={styles.content}>
          <Skeleton height={24} width="80%" borderRadius={4} />
          <Skeleton height={16} width="40%" borderRadius={4} style={{ marginTop: 8 }} />
          <Skeleton height={32} width="30%" borderRadius={4} style={{ marginTop: 16 }} />
          <Skeleton height={80} borderRadius={4} style={{ marginTop: 24 }} />
        </div>
      </main>
    );
  }

  const product = data?.products_by_pk;

  if (!product) {
    return (
      <main className={styles.page}>
        <div className={styles.header}>
          <Link href="/" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
        </div>
        <div className={styles.notFound}>
          <p>Product not found</p>
          <Link href="/">
            <Button>Go to Home</Button>
          </Link>
        </div>
      </main>
    );
  }

  const discountPercent = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const inCart = isInCart(product.id);
  const cartQuantity = getItemQuantity(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setQuantity(1);
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <ArrowLeft size={20} />
        </Link>
        <button className={styles.wishlistBtn}>
          <Heart size={20} />
        </button>
      </div>

      <div className={styles.imageContainer}>
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className={styles.image}
          priority
        />
        {product.is_sale && discountPercent > 0 && (
          <Badge variant="sale" className={styles.saleBadge}>
            {discountPercent}% OFF
          </Badge>
        )}
      </div>

      <div className={styles.content}>
        {product.category && (
          <Link
            href={`/category/${product.category.slug}`}
            className={styles.category}
          >
            {product.category.name}
          </Link>
        )}

        <h1 className={styles.name}>{product.name}</h1>

        <div className={styles.rating}>
          <Star size={16} fill="#ffd43b" stroke="#ffd43b" />
          <span className={styles.ratingValue}>{product.rating}</span>
          <span className={styles.reviewCount}>({product.review_count} reviews)</span>
        </div>

        <div className={styles.priceWrapper}>
          <span className={styles.price}>${product.price.toFixed(2)}</span>
          {product.original_price && (
            <span className={styles.originalPrice}>
              ${product.original_price.toFixed(2)}
            </span>
          )}
        </div>

        <div className={styles.description}>
          <h3>Description</h3>
          <p>{product.description}</p>
        </div>

        <div className={styles.stock}>
          {product.stock > 0 ? (
            <span className={styles.inStock}>In Stock ({product.stock} available)</span>
          ) : (
            <span className={styles.outOfStock}>Out of Stock</span>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.quantitySelector}>
          <button
            className={styles.quantityBtn}
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus size={18} />
          </button>
          <span className={styles.quantityValue}>{quantity}</span>
          <button
            className={styles.quantityBtn}
            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
            disabled={quantity >= product.stock}
          >
            <Plus size={18} />
          </button>
        </div>

        <Button
          size="lg"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={styles.addToCartBtn}
        >
          <ShoppingCart size={20} />
          {inCart ? `In Cart (${cartQuantity})` : 'Add to Cart'}
        </Button>
      </div>
    </main>
  );
}
