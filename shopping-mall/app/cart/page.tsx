'use client';

import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { CartItem, useCart, cartTotalAtom } from '@/entities/cart';
import { Button } from '@/shared/ui';
import styles from './page.module.css';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const total = useAtomValue(cartTotalAtom);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className={styles.title}>Cart</h1>
        {cart.length > 0 && (
          <button className={styles.clearBtn} onClick={clearCart}>
            Clear
          </button>
        )}
      </header>

      {cart.length === 0 ? (
        <div className={styles.empty}>
          <ShoppingBag size={64} strokeWidth={1} className={styles.emptyIcon} />
          <h2>Your cart is empty</h2>
          <p>Add some products to your cart to see them here</p>
          <Link href="/">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.items}>
            {cart.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span className={styles.free}>Free</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.totalRow}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.footer}>
            <Button size="lg" fullWidth>
              Checkout (${total.toFixed(2)})
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
