'use client';

import { ReactNode } from 'react';
import { Column } from '../model/types';
import styles from './ColumnHeader.module.css';

interface ColumnHeaderProps {
  column: Column;
  actions?: ReactNode;
}

export function ColumnHeader({ column, actions }: ColumnHeaderProps) {
  return (
    <div className={styles.header}>
      <h3 className={styles.title}>{column.title}</h3>
      <span className={styles.count}>{column.cards.length}</span>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
