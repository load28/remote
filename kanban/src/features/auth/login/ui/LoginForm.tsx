'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/shared/ui';
import { Input } from '@/shared/ui';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        // Store mock session for MSW
        if (typeof window !== 'undefined') {
          localStorage.setItem('mock-auth-session', 'true');
        }
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.header}>
        <h1 className={styles.title}>Sign In</h1>
        <p className={styles.subtitle}>Welcome back to Kanban Board</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="demo@example.com"
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="demo1234"
          required
        />
      </div>

      <Button type="submit" variant="primary" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>

      <div className={styles.demo}>
        <p>Demo credentials:</p>
        <code>demo@example.com / demo1234</code>
      </div>
    </form>
  );
}
