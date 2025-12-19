'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui';
import type { CartItemType } from '../model/types';
import styles from './CartItem.module.css';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className={styles.item}>
      <div className={styles.imageWrapper}>
        <Image
          src={item.image_url}
          alt={item.name}
          fill
          className={styles.image}
          sizes="80px"
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{item.name}</h3>
        <p className={styles.price}>${item.price.toFixed(2)}</p>
        <div className={styles.actions}>
          <div className={styles.quantity}>
            <button
              className={styles.quantityBtn}
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus size={14} />
            </button>
            <span className={styles.quantityValue}>{item.quantity}</span>
            <button
              className={styles.quantityBtn}
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            className={styles.removeBtn}
            onClick={() => onRemove(item.productId)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className={styles.subtotal}>
        ${(item.price * item.quantity).toFixed(2)}
      </div>
    </div>
  );
}
