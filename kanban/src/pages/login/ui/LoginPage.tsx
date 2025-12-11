'use client';

import { LoginForm } from '@/features/auth';
import styles from './LoginPage.module.css';

export function LoginPage() {
  return (
    <div className={styles.container}>
      <LoginForm />
    </div>
  );
}
