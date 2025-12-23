'use client';

import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import styles from './Skeleton.module.css';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, width, height, borderRadius, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(styles.skeleton, className)}
        style={{
          width,
          height,
          borderRadius,
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
