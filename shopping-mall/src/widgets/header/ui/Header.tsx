'use client';

import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { Search, ShoppingCart } from 'lucide-react';
import { cartCountAtom } from '@/entities/cart';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showCart?: boolean;
}

export function Header({
  title = 'Shop',
  showBack = false,
  showSearch = true,
  showCart = true,
}: HeaderProps) {
  const cartCount = useAtomValue(cartCountAtom);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {showBack ? (
          <Link href="/" className={styles.backBtn}>
            Back
          </Link>
        ) : (
          <h1 className={styles.title}>{title}</h1>
        )}
      </div>
      <div className={styles.right}>
        {showSearch && (
          <Link href="/search" className={styles.iconBtn}>
            <Search size={22} />
          </Link>
        )}
        {showCart && (
          <Link href="/cart" className={styles.iconBtn}>
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className={styles.badge}>{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
