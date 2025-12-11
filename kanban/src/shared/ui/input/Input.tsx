'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        <input
          ref={ref}
          className={cn(styles.input, error && styles.error, className)}
          {...props}
        />
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
