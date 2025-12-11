'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { Card as CardType } from '../model/types';
import styles from './CardItem.module.css';

interface CardItemProps extends HTMLAttributes<HTMLDivElement> {
  card: CardType;
  actions?: ReactNode;
  isDragging?: boolean;
}

export const CardItem = forwardRef<HTMLDivElement, CardItemProps>(
  ({ card, actions, isDragging, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(styles.card, isDragging && styles.dragging, className)}
        {...props}
      >
        {card.labels && card.labels.length > 0 && (
          <div className={styles.labels}>
            {card.labels.map((label) => (
              <span
                key={label.id}
                className={styles.label}
                style={{ backgroundColor: label.color }}
              />
            ))}
          </div>
        )}
        <p className={styles.title}>{card.title}</p>
        {card.description && (
          <p className={styles.description}>{card.description}</p>
        )}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    );
  }
);

CardItem.displayName = 'CardItem';
