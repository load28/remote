'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, ShoppingCart, Heart, User } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { cartCountAtom } from '@/entities/cart';
import clsx from 'clsx';
import styles from './BottomNav.module.css';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/categories', icon: Grid, label: 'Category' },
  { href: '/cart', icon: ShoppingCart, label: 'Cart', showBadge: true },
  { href: '/wishlist', icon: Heart, label: 'Wishlist' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useAtomValue(cartCountAtom);

  return (
    <nav className={styles.nav}>
      {navItems.map(({ href, icon: Icon, label, showBadge }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={clsx(styles.item, isActive && styles.active)}
          >
            <div className={styles.iconWrapper}>
              <Icon size={22} />
              {showBadge && cartCount > 0 && (
                <span className={styles.badge}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
