'use client';

import styles from './CommentList.module.css';
import { CommentItem } from '@/entities/comment';
import type { Comment } from '@/entities/comment';

interface CommentListProps {
  comments: Comment[];
  currentUserId: string;
  onUpdate: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
}

export function CommentList({
  comments,
  currentUserId,
  onUpdate,
  onDelete,
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          isOwner={comment.author.id === currentUserId}
          onUpdate={(content) => onUpdate(comment.id, content)}
          onDelete={() => onDelete(comment.id)}
        />
      ))}
    </div>
  );
}
