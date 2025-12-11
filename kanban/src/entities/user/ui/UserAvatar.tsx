'use client';

import { useAtomValue } from 'jotai';
import { currentUserAtom } from '../model';
import styles from './UserAvatar.module.css';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
}

export function UserAvatar({ size = 'md' }: UserAvatarProps) {
  const user = useAtomValue(currentUserAtom);

  if (!user) {
    return null;
  }

  const sizeMap = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  const pixelSize = sizeMap[size];

  return (
    <div className={styles.avatar} style={{ width: pixelSize, height: pixelSize }}>
      {user.image ? (
        <img src={user.image} alt={user.name} className={styles.image} />
      ) : (
        <span className={styles.initials}>
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </span>
      )}
    </div>
  );
}
