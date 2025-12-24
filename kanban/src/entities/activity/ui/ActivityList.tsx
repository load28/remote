'use client';

import styles from './ActivityList.module.css';
import type { Activity } from '../model';
import { ActivityItem } from './ActivityItem';

interface ActivityListProps {
  activities: Activity[];
  maxHeight?: number;
  emptyMessage?: string;
}

export function ActivityList({
  activities,
  maxHeight,
  emptyMessage = 'No activity yet',
}: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={styles.list}
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
    >
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
