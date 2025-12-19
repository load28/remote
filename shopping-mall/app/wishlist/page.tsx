'use client';

import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/shared/ui';
import styles from './page.module.css';

export default function WishlistPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className={styles.title}>Wishlist</h1>
        <div className={styles.placeholder} />
      </header>

      <div className={styles.empty}>
        <Heart size={64} strokeWidth={1} className={styles.emptyIcon} />
        <h2>Your wishlist is empty</h2>
        <p>Save your favorite items here for later</p>
        <Link href="/">
          <Button>Browse Products</Button>
        </Link>
      </div>
    </main>
  );
}
