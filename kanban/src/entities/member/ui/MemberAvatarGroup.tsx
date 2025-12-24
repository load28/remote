'use client';

import styles from './MemberAvatarGroup.module.css';
import { MemberAvatar } from './MemberAvatar';
import type { Member } from '../model';

interface MemberAvatarGroupProps {
  members: Pick<Member, 'id' | 'name' | 'avatar'>[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  onMemberClick?: (memberId: string) => void;
  onMoreClick?: () => void;
}

export function MemberAvatarGroup({
  members,
  max = 3,
  size = 'sm',
  onMemberClick,
  onMoreClick,
}: MemberAvatarGroupProps) {
  const visibleMembers = members.slice(0, max);
  const remainingCount = members.length - max;

  return (
    <div className={styles.group}>
      {visibleMembers.map((member) => (
        <div key={member.id} className={styles.item}>
          <MemberAvatar
            member={member}
            size={size}
            onClick={onMemberClick ? () => onMemberClick(member.id) : undefined}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <button
          type="button"
          className={`${styles.more} ${styles[size]}`}
          onClick={onMoreClick}
          title={`${remainingCount} more member${remainingCount > 1 ? 's' : ''}`}
        >
          +{remainingCount}
        </button>
      )}
    </div>
  );
}
