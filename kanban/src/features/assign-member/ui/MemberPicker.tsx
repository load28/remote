'use client';

import styles from './MemberPicker.module.css';
import { MemberAvatar } from '@/entities/member';
import type { Member } from '@/entities/member';

interface MemberPickerProps {
  members: Member[];
  assignedIds: string[];
  onToggle: (memberId: string) => void;
  onClose: () => void;
}

export function MemberPicker({
  members,
  assignedIds,
  onToggle,
  onClose,
}: MemberPickerProps) {
  return (
    <div className={styles.picker}>
      <div className={styles.header}>
        <h4 className={styles.title}>Members</h4>
        <button type="button" className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>

      <div className={styles.memberList}>
        {members.length === 0 ? (
          <p className={styles.emptyMessage}>No members in this board</p>
        ) : (
          members.map((member) => (
            <button
              key={member.id}
              type="button"
              className={`${styles.memberItem} ${assignedIds.includes(member.id) ? styles.assigned : ''}`}
              onClick={() => onToggle(member.id)}
            >
              <MemberAvatar member={member} size="sm" showTooltip={false} />
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{member.name}</span>
                <span className={styles.memberEmail}>{member.email}</span>
              </div>
              {assignedIds.includes(member.id) && <span className={styles.checkmark}>✓</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
