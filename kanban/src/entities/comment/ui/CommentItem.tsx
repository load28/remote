'use client';

import { useState } from 'react';
import styles from './CommentItem.module.css';
import type { Comment } from '../model';
import { formatCommentDate } from '../model';

interface CommentItemProps {
  comment: Comment;
  isOwner: boolean;
  onUpdate: (content: string) => void;
  onDelete: () => void;
}

export function CommentItem({ comment, isOwner, onUpdate, onDelete }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleSubmit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onUpdate(editContent.trim());
    } else {
      setEditContent(comment.content);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div className={styles.comment}>
      <div className={styles.avatar}>
        {comment.author.avatar ? (
          <img src={comment.author.avatar} alt={comment.author.name} />
        ) : (
          <span className={styles.initials}>
            {comment.author.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.authorName}>{comment.author.name}</span>
          <span className={styles.date}>
            {formatCommentDate(comment.createdAt)}
            {comment.isEdited && <span className={styles.edited}> (edited)</span>}
          </span>
        </div>

        {isEditing ? (
          <div className={styles.editForm}>
            <textarea
              className={styles.editInput}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
              rows={3}
            />
            <div className={styles.editActions}>
              <button type="button" className={styles.saveButton} onClick={handleSubmit}>
                Save
              </button>
              <button type="button" className={styles.cancelButton} onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className={styles.content}>{comment.content}</p>
            {isOwner && (
              <div className={styles.actions}>
                <button type="button" onClick={() => setIsEditing(true)}>
                  Edit
                </button>
                <button type="button" onClick={onDelete}>
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
