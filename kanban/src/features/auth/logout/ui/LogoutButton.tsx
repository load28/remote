'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/shared/ui';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function LogoutButton({ variant = 'ghost' }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Clear mock session
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mock-auth-session');
      }
      await signOut({ redirect: false });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant={variant} onClick={handleLogout} disabled={isLoading}>
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
}
