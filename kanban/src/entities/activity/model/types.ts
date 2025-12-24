export type ActivityType =
  | 'card_created'
  | 'card_updated'
  | 'card_moved'
  | 'card_deleted'
  | 'card_archived'
  | 'comment_added'
  | 'comment_updated'
  | 'comment_deleted'
  | 'checklist_added'
  | 'checklist_completed'
  | 'checklist_item_completed'
  | 'checklist_item_uncompleted'
  | 'label_added'
  | 'label_removed'
  | 'member_assigned'
  | 'member_unassigned'
  | 'due_date_set'
  | 'due_date_removed'
  | 'due_date_completed'
  | 'attachment_added'
  | 'attachment_removed';

export interface Activity {
  id: string;
  type: ActivityType;
  cardId: string;
  boardId: string;
  actor: {
    id: string;
    name: string;
    avatar?: string;
  };
  data: ActivityData;
  createdAt: string;
}

export type ActivityData =
  | CardCreatedData
  | CardUpdatedData
  | CardMovedData
  | CommentData
  | ChecklistData
  | ChecklistItemData
  | LabelData
  | MemberData
  | DueDateData;

interface CardCreatedData {
  cardTitle: string;
  columnName: string;
}

interface CardUpdatedData {
  field: string;
  oldValue?: string;
  newValue?: string;
}

interface CardMovedData {
  fromColumn: string;
  toColumn: string;
}

interface CommentData {
  commentId: string;
  content?: string;
}

interface ChecklistData {
  checklistId: string;
  checklistTitle: string;
}

interface ChecklistItemData {
  checklistId: string;
  checklistTitle: string;
  itemId: string;
  itemTitle: string;
}

interface LabelData {
  labelId: string;
  labelName: string;
  labelColor: string;
}

interface MemberData {
  memberId: string;
  memberName: string;
}

interface DueDateData {
  dueDate?: string;
}

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  card_created: '📝',
  card_updated: '✏️',
  card_moved: '↔️',
  card_deleted: '🗑️',
  card_archived: '📦',
  comment_added: '💬',
  comment_updated: '📝',
  comment_deleted: '🗑️',
  checklist_added: '☑️',
  checklist_completed: '✅',
  checklist_item_completed: '✓',
  checklist_item_uncompleted: '○',
  label_added: '🏷️',
  label_removed: '🏷️',
  member_assigned: '👤',
  member_unassigned: '👤',
  due_date_set: '📅',
  due_date_removed: '📅',
  due_date_completed: '✅',
  attachment_added: '📎',
  attachment_removed: '📎',
};

export function getActivityMessage(activity: Activity): string {
  const { type, data } = activity;

  switch (type) {
    case 'card_created':
      return `created this card in ${(data as CardCreatedData).columnName}`;
    case 'card_updated':
      return `updated ${(data as CardUpdatedData).field}`;
    case 'card_moved':
      return `moved this card from ${(data as CardMovedData).fromColumn} to ${(data as CardMovedData).toColumn}`;
    case 'card_deleted':
      return 'deleted this card';
    case 'card_archived':
      return 'archived this card';
    case 'comment_added':
      return 'added a comment';
    case 'comment_updated':
      return 'updated a comment';
    case 'comment_deleted':
      return 'deleted a comment';
    case 'checklist_added':
      return `added checklist "${(data as ChecklistData).checklistTitle}"`;
    case 'checklist_completed':
      return `completed checklist "${(data as ChecklistData).checklistTitle}"`;
    case 'checklist_item_completed':
      return `completed "${(data as ChecklistItemData).itemTitle}"`;
    case 'checklist_item_uncompleted':
      return `uncompleted "${(data as ChecklistItemData).itemTitle}"`;
    case 'label_added':
      return `added label "${(data as LabelData).labelName}"`;
    case 'label_removed':
      return `removed label "${(data as LabelData).labelName}"`;
    case 'member_assigned':
      return `assigned ${(data as MemberData).memberName}`;
    case 'member_unassigned':
      return `unassigned ${(data as MemberData).memberName}`;
    case 'due_date_set':
      return `set due date to ${(data as DueDateData).dueDate}`;
    case 'due_date_removed':
      return 'removed due date';
    case 'due_date_completed':
      return 'marked due date as complete';
    case 'attachment_added':
      return 'added an attachment';
    case 'attachment_removed':
      return 'removed an attachment';
    default:
      return 'performed an action';
  }
}

export function formatActivityDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
