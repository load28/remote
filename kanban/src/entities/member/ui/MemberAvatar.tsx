'use client';

import styles from './MemberAvatar.module.css';
import type { Member } from '../model';

interface MemberAvatarProps {
  member: Pick<Member, 'name' | 'avatar'>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  onClick?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6',
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

export function MemberAvatar({ member, size = 'md', showTooltip = true, onClick }: MemberAvatarProps) {
  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      title={showTooltip ? member.name : undefined}
    >
      {member.avatar ? (
        <img src={member.avatar} alt={member.name} className={styles.image} />
      ) : (
        <span
          className={styles.initials}
          style={{ backgroundColor: getAvatarColor(member.name) }}
        >
          {getInitials(member.name)}
        </span>
      )}
    </div>
  );
}
