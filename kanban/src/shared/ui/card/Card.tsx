'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/shared/lib';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(styles.card, className)} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
