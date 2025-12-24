'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './CardDetailModal.module.css';
import { Modal } from '@/shared/ui';
import type { Card } from '@/entities/card';
import { LabelBadge } from '@/entities/label';
import type { Label } from '@/entities/label';
import { MemberAvatar, MemberAvatarGroup } from '@/entities/member';
import type { Member } from '@/entities/member';
import type { Checklist } from '@/entities/checklist';
import type { Comment } from '@/entities/comment';
import type { Activity } from '@/entities/activity';
import { ActivityList } from '@/entities/activity';
import { LabelPicker } from '@/features/manage-labels';
import { MemberPicker } from '@/features/assign-member';
import { DueDatePicker, DueDateBadge } from '@/features/set-due-date';
import { ChecklistSection, AddChecklistForm } from '@/features/manage-checklist';
import { CommentForm, CommentList } from '@/features/add-comment';
import { CARD_PRIORITY_LABELS, CARD_PRIORITY_COLORS, type CardPriority } from '@/entities/card';

interface CardDetailModalProps {
  card: Card;
  columnTitle: string;
  boardLabels: Label[];
  boardMembers: Member[];
  checklists: Checklist[];
  comments: Comment[];
  activities: Activity[];
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCard: (updates: Partial<Card>) => void;
  onDeleteCard: () => void;
  onToggleLabel: (label: Label) => void;
  onCreateLabel: (name: string, color: string) => void;
  onToggleAssignee: (memberId: string) => void;
  onSetDueDate: (date: string | null, isCompleted: boolean) => void;
  onCreateChecklist: (title: string) => void;
  onDeleteChecklist: (checklistId: string) => void;
  onToggleChecklistItem: (checklistId: string, itemId: string, isCompleted: boolean) => void;
  onUpdateChecklistItem: (checklistId: string, itemId: string, title: string) => void;
  onDeleteChecklistItem: (checklistId: string, itemId: string) => void;
  onAddChecklistItem: (checklistId: string, title: string) => void;
  onAddComment: (content: string) => void;
  onUpdateComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
}

type SidebarPopover = 'labels' | 'members' | 'dueDate' | 'checklist' | 'priority' | null;

export function CardDetailModal({
  card,
  columnTitle,
  boardLabels,
  boardMembers,
  checklists,
  comments,
  activities,
  currentUserId,
  isOpen,
  onClose,
  onUpdateCard,
  onDeleteCard,
  onToggleLabel,
  onCreateLabel,
  onToggleAssignee,
  onSetDueDate,
  onCreateChecklist,
  onDeleteChecklist,
  onToggleChecklistItem,
  onUpdateChecklistItem,
  onDeleteChecklistItem,
  onAddChecklistItem,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: CardDetailModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDescription, setEditDescription] = useState(card.description || '');
  const [activePopover, setActivePopover] = useState<SidebarPopover>(null);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditTitle(card.title);
    setEditDescription(card.description || '');
  }, [card]);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== card.title) {
      onUpdateCard({ title: editTitle.trim() });
    } else {
      setEditTitle(card.title);
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    if (editDescription !== card.description) {
      onUpdateCard({ description: editDescription || undefined });
    }
    setIsEditingDescription(false);
  };

  const assignedMembers = boardMembers.filter((m) => card.assigneeIds?.includes(m.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal} onClick={() => setActivePopover(null)}>
        {/* Cover Image */}
        {card.coverImage && (
          <div className={styles.coverImage}>
            <img src={card.coverImage} alt="" />
          </div>
        )}

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            {isEditingTitle ? (
              <textarea
                ref={titleInputRef}
                className={styles.titleInput}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveTitle();
                  } else if (e.key === 'Escape') {
                    setEditTitle(card.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                rows={1}
              />
            ) : (
              <h2
                className={styles.title}
                onClick={() => setIsEditingTitle(true)}
              >
                {card.title}
              </h2>
            )}
            <p className={styles.columnInfo}>
              in list <strong>{columnTitle}</strong>
            </p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          {/* Main Content */}
          <div className={styles.mainContent}>
            {/* Labels & Members Row */}
            {(card.labels && card.labels.length > 0) || assignedMembers.length > 0 ? (
              <div className={styles.metaRow}>
                {card.labels && card.labels.length > 0 && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Labels</span>
                    <div className={styles.labels}>
                      {card.labels.map((label) => (
                        <LabelBadge key={label.id} label={label} size="md" />
                      ))}
                    </div>
                  </div>
                )}
                {assignedMembers.length > 0 && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Members</span>
                    <MemberAvatarGroup members={assignedMembers} max={5} size="md" />
                  </div>
                )}
                {card.dueDate && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Due date</span>
                    <DueDateBadge
                      dueDate={card.dueDate}
                      isCompleted={card.dueDateCompleted}
                    />
                  </div>
                )}
                {card.priority && card.priority !== 'none' && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Priority</span>
                    <span
                      className={styles.priorityBadge}
                      style={{ backgroundColor: CARD_PRIORITY_COLORS[card.priority] }}
                    >
                      {CARD_PRIORITY_LABELS[card.priority]}
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Description */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>📝 Description</h3>
              {isEditingDescription ? (
                <div className={styles.descriptionEdit}>
                  <textarea
                    className={styles.descriptionInput}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                    rows={4}
                    autoFocus
                  />
                  <div className={styles.descriptionActions}>
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={handleSaveDescription}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => {
                        setEditDescription(card.description || '');
                        setIsEditingDescription(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`${styles.description} ${!card.description ? styles.placeholder : ''}`}
                  onClick={() => setIsEditingDescription(true)}
                >
                  {card.description || 'Add a more detailed description...'}
                </div>
              )}
            </div>

            {/* Checklists */}
            {checklists.length > 0 && (
              <div className={styles.section}>
                {checklists.map((checklist) => (
                  <ChecklistSection
                    key={checklist.id}
                    checklist={checklist}
                    onToggleItem={(itemId, isCompleted) =>
                      onToggleChecklistItem(checklist.id, itemId, isCompleted)
                    }
                    onUpdateItem={(itemId, title) =>
                      onUpdateChecklistItem(checklist.id, itemId, title)
                    }
                    onDeleteItem={(itemId) => onDeleteChecklistItem(checklist.id, itemId)}
                    onAddItem={(title) => onAddChecklistItem(checklist.id, title)}
                    onDelete={() => onDeleteChecklist(checklist.id)}
                  />
                ))}
              </div>
            )}

            {/* Comments & Activity Tabs */}
            <div className={styles.section}>
              <div className={styles.tabHeader}>
                <button
                  type="button"
                  className={`${styles.tab} ${activeTab === 'comments' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('comments')}
                >
                  💬 Comments ({comments.length})
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${activeTab === 'activity' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('activity')}
                >
                  📋 Activity
                </button>
              </div>

              {activeTab === 'comments' ? (
                <div className={styles.commentsSection}>
                  <CommentForm onSubmit={onAddComment} />
                  <CommentList
                    comments={comments}
                    currentUserId={currentUserId}
                    onUpdate={onUpdateComment}
                    onDelete={onDeleteComment}
                  />
                </div>
              ) : (
                <ActivityList activities={activities} maxHeight={300} />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarSection}>
              <h4 className={styles.sidebarTitle}>Add to card</h4>

              <div className={styles.sidebarButtons}>
                <div className={styles.popoverWrapper}>
                  <button
                    type="button"
                    className={styles.sidebarButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePopover(activePopover === 'members' ? null : 'members');
                    }}
                  >
                    👤 Members
                  </button>
                  {activePopover === 'members' && (
                    <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
                      <MemberPicker
                        members={boardMembers}
                        assignedIds={card.assigneeIds || []}
                        onToggle={onToggleAssignee}
                        onClose={() => setActivePopover(null)}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.popoverWrapper}>
                  <button
                    type="button"
                    className={styles.sidebarButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePopover(activePopover === 'labels' ? null : 'labels');
                    }}
                  >
                    🏷️ Labels
                  </button>
                  {activePopover === 'labels' && (
                    <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
                      <LabelPicker
                        labels={boardLabels}
                        selectedLabels={card.labels || []}
                        onToggle={onToggleLabel}
                        onCreate={onCreateLabel}
                        onClose={() => setActivePopover(null)}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.popoverWrapper}>
                  <button
                    type="button"
                    className={styles.sidebarButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePopover(activePopover === 'checklist' ? null : 'checklist');
                    }}
                  >
                    ☑️ Checklist
                  </button>
                  {activePopover === 'checklist' && (
                    <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
                      <AddChecklistForm
                        onAdd={(title) => {
                          onCreateChecklist(title);
                          setActivePopover(null);
                        }}
                        onCancel={() => setActivePopover(null)}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.popoverWrapper}>
                  <button
                    type="button"
                    className={styles.sidebarButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePopover(activePopover === 'dueDate' ? null : 'dueDate');
                    }}
                  >
                    📅 Due date
                  </button>
                  {activePopover === 'dueDate' && (
                    <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
                      <DueDatePicker
                        currentDate={card.dueDate}
                        isCompleted={card.dueDateCompleted}
                        onSave={onSetDueDate}
                        onClose={() => setActivePopover(null)}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.popoverWrapper}>
                  <button
                    type="button"
                    className={styles.sidebarButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePopover(activePopover === 'priority' ? null : 'priority');
                    }}
                  >
                    🚩 Priority
                  </button>
                  {activePopover === 'priority' && (
                    <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.priorityPicker}>
                        <div className={styles.priorityPickerHeader}>
                          <h4>Priority</h4>
                          <button
                            type="button"
                            onClick={() => setActivePopover(null)}
                          >
                            ×
                          </button>
                        </div>
                        <div className={styles.priorityOptions}>
                          {(Object.entries(CARD_PRIORITY_LABELS) as [CardPriority, string][]).map(
                            ([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                className={`${styles.priorityOption} ${card.priority === value ? styles.selected : ''}`}
                                onClick={() => {
                                  onUpdateCard({ priority: value });
                                  setActivePopover(null);
                                }}
                              >
                                <span
                                  className={styles.priorityDot}
                                  style={{ backgroundColor: CARD_PRIORITY_COLORS[value] }}
                                />
                                {label}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.sidebarSection}>
              <h4 className={styles.sidebarTitle}>Actions</h4>
              <div className={styles.sidebarButtons}>
                <button
                  type="button"
                  className={styles.sidebarButton}
                  onClick={() => onUpdateCard({ isArchived: !card.isArchived })}
                >
                  📦 {card.isArchived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  type="button"
                  className={`${styles.sidebarButton} ${styles.dangerButton}`}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this card?')) {
                      onDeleteCard();
                    }
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
