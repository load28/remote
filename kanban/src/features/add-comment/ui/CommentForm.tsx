'use client';

import { useState } from 'react';
import styles from './CommentForm.module.css';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
  submitLabel?: string;
}

export function CommentForm({
  onSubmit,
  placeholder = 'Write a comment...',
  submitLabel = 'Save',
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      setContent('');
      setIsFocused(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <textarea
        className={styles.textarea}
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          if (!content.trim() && !e.relatedTarget?.closest(`.${styles.form}`)) {
            setIsFocused(false);
          }
        }}
        onKeyDown={handleKeyDown}
        rows={isFocused ? 3 : 1}
      />
      {(isFocused || content.trim()) && (
        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={!content.trim()}
          >
            {submitLabel}
          </button>
          <span className={styles.hint}>Ctrl+Enter to submit</span>
        </div>
      )}
    </form>
  );
}
