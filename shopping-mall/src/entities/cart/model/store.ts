'use client';

import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { CartItemType } from './types';
import type { Product } from '@/shared/types';

// Cart state with localStorage persistence
export const cartAtom = atomWithStorage<CartItemType[]>('shopping-cart', []);

// Derived atoms
export const cartTotalAtom = atom((get) => {
  const cart = get(cartAtom);
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
});

export const cartCountAtom = atom((get) => {
  const cart = get(cartAtom);
  return cart.reduce((count, item) => count + item.quantity, 0);
});

// Custom hook for cart operations
export function useCart() {
  const [cart, setCart] = useAtom(cartAtom);

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.productId === product.id);

      if (existingItem) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock) }
            : item
        );
      }

      return [
        ...prev,
        {
          id: Date.now(),
          productId: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity,
          stock: product.stock,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const isInCart = (productId: number) => {
    return cart.some((item) => item.productId === productId);
  };

  const getItemQuantity = (productId: number) => {
    const item = cart.find((item) => item.productId === productId);
    return item?.quantity ?? 0;
  };

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isInCart,
    getItemQuantity,
  };
}
