'use client';

import styles from './ActivityItem.module.css';
import type { Activity } from '../model';
import { ACTIVITY_ICONS, getActivityMessage, formatActivityDate } from '../model';

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  return (
    <div className={styles.activity}>
      <div className={styles.avatar}>
        {activity.actor.avatar ? (
          <img src={activity.actor.avatar} alt={activity.actor.name} />
        ) : (
          <span className={styles.initials}>
            {activity.actor.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </span>
        )}
      </div>

      <div className={styles.content}>
        <p className={styles.message}>
          <span className={styles.icon}>{ACTIVITY_ICONS[activity.type]}</span>
          <strong>{activity.actor.name}</strong>
          {' '}
          {getActivityMessage(activity)}
        </p>
        <span className={styles.time}>{formatActivityDate(activity.createdAt)}</span>
      </div>
    </div>
  );
}
