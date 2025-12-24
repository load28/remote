import { v4 as uuidv4 } from 'uuid';
import type { Board } from '@/entities/board';
import type { Column } from '@/entities/column';
import type { Card, CardLabel } from '@/entities/card';
import type { Label } from '@/entities/label';
import type { Member, MemberRole } from '@/entities/member';
import type { Checklist, ChecklistItem } from '@/entities/checklist';
import type { Comment } from '@/entities/comment';
import type { Activity, ActivityType, ActivityData } from '@/entities/activity';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: string;
}

interface BoardExtras {
  labels: Label[];
  members: Member[];
  checklists: Checklist[];
  comments: Comment[];
  activities: Activity[];
}

interface MockDb {
  users: User[];
  boards: Board[];
  boardExtras: Record<string, BoardExtras>;
}

const createInitialData = (): MockDb => {
  const userId = 'user-1';
  const userId2 = 'user-2';
  const boardId = 'board-1';
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const columns: Column[] = [
    {
      id: 'col-1',
      title: 'To Do',
      boardId,
      order: 0,
      cards: [
        {
          id: 'card-1',
          title: 'Design login page',
          description: 'Create UI mockups for the login page with responsive design',
          columnId: 'col-1',
          order: 0,
          createdAt: now,
          updatedAt: now,
          labels: [{ id: 'label-1', name: 'Design', color: '#8B5CF6' }],
          assigneeIds: [userId],
          dueDate: tomorrow,
          priority: 'high',
        },
        {
          id: 'card-2',
          title: 'Setup authentication',
          description: 'Implement Auth.js with Supabase provider',
          columnId: 'col-1',
          order: 1,
          createdAt: now,
          updatedAt: now,
          labels: [{ id: 'label-2', name: 'Backend', color: '#10B981' }],
          assigneeIds: [userId2],
          dueDate: nextWeek,
          priority: 'medium',
        },
      ],
      createdAt: now,
    },
    {
      id: 'col-2',
      title: 'In Progress',
      boardId,
      order: 1,
      cards: [
        {
          id: 'card-3',
          title: 'Implement drag and drop',
          description: 'Add drag and drop functionality using dnd-kit library for card movement',
          columnId: 'col-2',
          order: 0,
          createdAt: now,
          updatedAt: now,
          labels: [
            { id: 'label-3', name: 'Feature', color: '#3B82F6' },
            { id: 'label-1', name: 'Design', color: '#8B5CF6' },
          ],
          assigneeIds: [userId, userId2],
          priority: 'urgent',
          commentCount: 2,
        },
      ],
      createdAt: now,
    },
    {
      id: 'col-3',
      title: 'Done',
      boardId,
      order: 2,
      cards: [
        {
          id: 'card-4',
          title: 'Project setup',
          description: 'Initialize Next.js project with FSD architecture and configure TypeScript',
          columnId: 'col-3',
          order: 0,
          createdAt: yesterday,
          updatedAt: now,
          labels: [{ id: 'label-4', name: 'Setup', color: '#F59E0B' }],
          dueDate: yesterday,
          dueDateCompleted: true,
          priority: 'low',
        },
      ],
      createdAt: now,
    },
  ];

  const users: User[] = [
    {
      id: userId,
      email: 'demo@example.com',
      name: 'Demo User',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      createdAt: now,
    },
    {
      id: userId2,
      email: 'john@example.com',
      name: 'John Doe',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      createdAt: now,
    },
  ];

  const labels: Label[] = [
    { id: 'label-1', name: 'Design', color: '#8B5CF6', boardId, createdAt: now },
    { id: 'label-2', name: 'Backend', color: '#10B981', boardId, createdAt: now },
    { id: 'label-3', name: 'Feature', color: '#3B82F6', boardId, createdAt: now },
    { id: 'label-4', name: 'Setup', color: '#F59E0B', boardId, createdAt: now },
    { id: 'label-5', name: 'Bug', color: '#EF4444', boardId, createdAt: now },
    { id: 'label-6', name: 'Documentation', color: '#6B7280', boardId, createdAt: now },
  ];

  const members: Member[] = [
    { id: userId, name: 'Demo User', email: 'demo@example.com', avatar: users[0].image, role: 'owner', boardId, joinedAt: now },
    { id: userId2, name: 'John Doe', email: 'john@example.com', avatar: users[1].image, role: 'member', boardId, joinedAt: now },
  ];

  const checklists: Checklist[] = [
    {
      id: 'checklist-1',
      title: 'Implementation Steps',
      cardId: 'card-3',
      items: [
        { id: 'item-1', title: 'Install dnd-kit packages', isCompleted: true, order: 0 },
        { id: 'item-2', title: 'Setup DndContext', isCompleted: true, order: 1 },
        { id: 'item-3', title: 'Create sortable components', isCompleted: false, order: 2 },
        { id: 'item-4', title: 'Handle drag events', isCompleted: false, order: 3 },
        { id: 'item-5', title: 'Add visual feedback', isCompleted: false, order: 4 },
      ],
      createdAt: now,
    },
  ];

  const comments: Comment[] = [
    {
      id: 'comment-1',
      cardId: 'card-3',
      content: 'I started working on this today. The dnd-kit library looks promising!',
      author: { id: userId, name: 'Demo User', avatar: users[0].image },
      createdAt: yesterday,
      updatedAt: yesterday,
      isEdited: false,
    },
    {
      id: 'comment-2',
      cardId: 'card-3',
      content: 'Let me know if you need any help with the implementation.',
      author: { id: userId2, name: 'John Doe', avatar: users[1].image },
      createdAt: now,
      updatedAt: now,
      isEdited: false,
    },
  ];

  const activities: Activity[] = [
    {
      id: 'activity-1',
      type: 'card_created',
      cardId: 'card-3',
      boardId,
      actor: { id: userId, name: 'Demo User', avatar: users[0].image },
      data: { cardTitle: 'Implement drag and drop', columnName: 'In Progress' },
      createdAt: yesterday,
    },
    {
      id: 'activity-2',
      type: 'comment_added',
      cardId: 'card-3',
      boardId,
      actor: { id: userId, name: 'Demo User', avatar: users[0].image },
      data: { commentId: 'comment-1' },
      createdAt: yesterday,
    },
    {
      id: 'activity-3',
      type: 'checklist_added',
      cardId: 'card-3',
      boardId,
      actor: { id: userId, name: 'Demo User', avatar: users[0].image },
      data: { checklistId: 'checklist-1', checklistTitle: 'Implementation Steps' },
      createdAt: now,
    },
  ];

  return {
    users,
    boards: [
      {
        id: boardId,
        title: 'My First Board',
        columns,
        createdAt: now,
        updatedAt: now,
      },
    ],
    boardExtras: {
      [boardId]: {
        labels,
        members,
        checklists,
        comments,
        activities,
      },
    },
  };
};

class MockDatabase {
  private data: MockDb;

  constructor() {
    this.data = createInitialData();
  }

  // User methods
  getUsers() {
    return this.data.users;
  }

  getUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string) {
    return this.data.users.find((u) => u.email === email);
  }

  createUser(userData: Omit<User, 'id' | 'createdAt'>) {
    const user: User = {
      ...userData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(user);
    return user;
  }

  // Board methods
  getBoards() {
    return this.data.boards;
  }

  getBoardById(id: string) {
    return this.data.boards.find((b) => b.id === id);
  }

  createBoard(title: string): Board {
    const now = new Date().toISOString();
    const board: Board = {
      id: uuidv4(),
      title,
      columns: [],
      createdAt: now,
      updatedAt: now,
    };
    this.data.boards.push(board);
    return board;
  }

  updateBoard(id: string, updates: { title?: string }): Board | null {
    const board = this.getBoardById(id);
    if (!board) return null;
    if (updates.title) board.title = updates.title;
    board.updatedAt = new Date().toISOString();
    return board;
  }

  deleteBoard(id: string): boolean {
    const index = this.data.boards.findIndex((b) => b.id === id);
    if (index === -1) return false;
    this.data.boards.splice(index, 1);
    return true;
  }

  // Column methods
  createColumn(boardId: string, title: string): Column | null {
    const board = this.getBoardById(boardId);
    if (!board) return null;
    const column: Column = {
      id: uuidv4(),
      title,
      boardId,
      order: board.columns.length,
      cards: [],
      createdAt: new Date().toISOString(),
    };
    board.columns.push(column);
    board.updatedAt = new Date().toISOString();
    return column;
  }

  updateColumn(boardId: string, columnId: string, title: string): Column | null {
    const board = this.getBoardById(boardId);
    if (!board) return null;
    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return null;
    column.title = title;
    board.updatedAt = new Date().toISOString();
    return column;
  }

  deleteColumn(boardId: string, columnId: string): boolean {
    const board = this.getBoardById(boardId);
    if (!board) return false;
    const index = board.columns.findIndex((c) => c.id === columnId);
    if (index === -1) return false;
    board.columns.splice(index, 1);
    board.columns.forEach((col, i) => (col.order = i));
    board.updatedAt = new Date().toISOString();
    return true;
  }

  // Card methods
  createCard(boardId: string, columnId: string, data: { title: string; description?: string }): Card | null {
    const board = this.getBoardById(boardId);
    if (!board) return null;
    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return null;
    const now = new Date().toISOString();
    const card: Card = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      columnId,
      order: column.cards.length,
      createdAt: now,
      updatedAt: now,
      labels: [],
    };
    column.cards.push(card);
    board.updatedAt = now;
    return card;
  }

  updateCard(boardId: string, cardId: string, updates: { title?: string; description?: string }): Card | null {
    const board = this.getBoardById(boardId);
    if (!board) return null;
    for (const column of board.columns) {
      const card = column.cards.find((c) => c.id === cardId);
      if (card) {
        if (updates.title !== undefined) card.title = updates.title;
        if (updates.description !== undefined) card.description = updates.description;
        card.updatedAt = new Date().toISOString();
        board.updatedAt = card.updatedAt;
        return card;
      }
    }
    return null;
  }

  deleteCard(boardId: string, cardId: string): boolean {
    const board = this.getBoardById(boardId);
    if (!board) return false;
    for (const column of board.columns) {
      const index = column.cards.findIndex((c) => c.id === cardId);
      if (index !== -1) {
        column.cards.splice(index, 1);
        column.cards.forEach((c, i) => (c.order = i));
        board.updatedAt = new Date().toISOString();
        return true;
      }
    }
    return false;
  }

  moveCard(boardId: string, cardId: string, targetColumnId: string, targetOrder: number): Card | null {
    const board = this.getBoardById(boardId);
    if (!board) return null;

    let movedCard: Card | null = null;
    let sourceColumn: Column | null = null;

    for (const column of board.columns) {
      const index = column.cards.findIndex((c) => c.id === cardId);
      if (index !== -1) {
        movedCard = column.cards.splice(index, 1)[0];
        sourceColumn = column;
        break;
      }
    }

    if (!movedCard) return null;

    const targetColumn = board.columns.find((c) => c.id === targetColumnId);
    if (!targetColumn) {
      sourceColumn?.cards.push(movedCard);
      return null;
    }

    movedCard.columnId = targetColumnId;
    movedCard.order = targetOrder;
    movedCard.updatedAt = new Date().toISOString();

    targetColumn.cards.splice(targetOrder, 0, movedCard);
    targetColumn.cards.forEach((c, i) => (c.order = i));

    if (sourceColumn && sourceColumn.id !== targetColumnId) {
      sourceColumn.cards.forEach((c, i) => (c.order = i));
    }

    board.updatedAt = movedCard.updatedAt;
    return movedCard;
  }

  reset() {
    this.data = createInitialData();
  }

  // Helper to get or create board extras
  private getBoardExtras(boardId: string): BoardExtras {
    if (!this.data.boardExtras[boardId]) {
      this.data.boardExtras[boardId] = {
        labels: [],
        members: [],
        checklists: [],
        comments: [],
        activities: [],
      };
    }
    return this.data.boardExtras[boardId];
  }

  private getCurrentUser(): User {
    return this.data.users[0];
  }

  private addActivity(boardId: string, cardId: string, type: ActivityType, data: ActivityData): void {
    const extras = this.getBoardExtras(boardId);
    const user = this.getCurrentUser();
    const activity: Activity = {
      id: uuidv4(),
      type,
      cardId,
      boardId,
      actor: { id: user.id, name: user.name, avatar: user.image },
      data,
      createdAt: new Date().toISOString(),
    };
    extras.activities.unshift(activity);
  }

  // Label methods
  getLabels(boardId: string): Label[] {
    return this.getBoardExtras(boardId).labels;
  }

  createLabel(boardId: string, data: { name: string; color: string }): Label {
    const extras = this.getBoardExtras(boardId);
    const label: Label = {
      id: uuidv4(),
      name: data.name,
      color: data.color,
      boardId,
      createdAt: new Date().toISOString(),
    };
    extras.labels.push(label);
    return label;
  }

  updateLabel(boardId: string, labelId: string, data: { name?: string; color?: string }): Label | null {
    const extras = this.getBoardExtras(boardId);
    const label = extras.labels.find((l) => l.id === labelId);
    if (!label) return null;
    if (data.name !== undefined) label.name = data.name;
    if (data.color !== undefined) label.color = data.color;
    return label;
  }

  deleteLabel(boardId: string, labelId: string): boolean {
    const extras = this.getBoardExtras(boardId);
    const index = extras.labels.findIndex((l) => l.id === labelId);
    if (index === -1) return false;
    extras.labels.splice(index, 1);
    return true;
  }

  addLabelToCard(boardId: string, cardId: string, labelId: string): boolean {
    const board = this.getBoardById(boardId);
    const extras = this.getBoardExtras(boardId);
    if (!board) return false;

    const label = extras.labels.find((l) => l.id === labelId);
    if (!label) return false;

    for (const column of board.columns) {
      const card = column.cards.find((c) => c.id === cardId);
      if (card) {
        if (!card.labels) card.labels = [];
        if (!card.labels.some((l) => l.id === labelId)) {
          card.labels.push({ id: label.id, name: label.name, color: label.color });
          this.addActivity(boardId, cardId, 'label_added', {
            labelId: label.id,
            labelName: label.name,
            labelColor: label.color,
          });
        }
        return true;
      }
    }
    return false;
  }

  removeLabelFromCard(boardId: string, cardId: string, labelId: string): boolean {
    const board = this.getBoardById(boardId);
    if (!board) return false;

    for (const column of board.columns) {
      const card = column.cards.find((c) => c.id === cardId);
      if (card && card.labels) {
        const labelIndex = card.labels.findIndex((l) => l.id === labelId);
        if (labelIndex !== -1) {
          const removedLabel = card.labels[labelIndex];
          card.labels.splice(labelIndex, 1);
          this.addActivity(boardId, cardId, 'label_removed', {
            labelId: removedLabel.id,
            labelName: removedLabel.name,
            labelColor: removedLabel.color,
          });
          return true;
        }
      }
    }
    return false;
  }

  // Member methods
  getMembers(boardId: string): Member[] {
    return this.getBoardExtras(boardId).members;
  }

  inviteMember(boardId: string, data: { email: string; role: string }): Member | null {
    const user = this.data.users.find((u) => u.email === data.email);
    if (!user) return null;

    const extras = this.getBoardExtras(boardId);
    const member: Member = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.image,
      role: data.role as MemberRole,
      boardId,
      joinedAt: new Date().toISOString(),
    };
    extras.members.push(member);
    return member;
  }

  updateMemberRole(boardId: string, memberId: string, role: string): Member | null {
    const extras = this.getBoardExtras(boardId);
    const member = extras.members.find((m) => m.id === memberId);
    if (!member) return null;
    member.role = role as MemberRole;
    return member;
  }

  removeMember(boardId: string, memberId: string): boolean {
    const extras = this.getBoardExtras(boardId);
    const index = extras.members.findIndex((m) => m.id === memberId);
    if (index === -1) return false;
    extras.members.splice(index, 1);
    return true;
  }

  assignMemberToCard(boardId: string, cardId: string, memberId: string): boolean {
    const board = this.getBoardById(boardId);
    const extras = this.getBoardExtras(boardId);
    if (!board) return false;

    const member = extras.members.find((m) => m.id === memberId);
    if (!member) return false;

    for (const column of board.columns) {
      const card = column.cards.find((c) => c.id === cardId);
      if (card) {
        if (!card.assigneeIds) card.assigneeIds = [];
        if (!card.assigneeIds.includes(memberId)) {
          card.assigneeIds.push(memberId);
          this.addActivity(boardId, cardId, 'member_assigned', {
            memberId: member.id,
            memberName: member.name,
          });
        }
        return true;
      }
    }
    return false;
  }

  unassignMemberFromCard(boardId: string, cardId: string, memberId: string): boolean {
    const board = this.getBoardById(boardId);
    const extras = this.getBoardExtras(boardId);
    if (!board) return false;

    const member = extras.members.find((m) => m.id === memberId);

    for (const column of board.columns) {
      const card = column.cards.find((c) => c.id === cardId);
      if (card && card.assigneeIds) {
        const index = card.assigneeIds.indexOf(memberId);
        if (index !== -1) {
          card.assigneeIds.splice(index, 1);
          if (member) {
            this.addActivity(boardId, cardId, 'member_unassigned', {
              memberId: member.id,
              memberName: member.name,
            });
          }
          return true;
        }
      }
    }
    return false;
  }

  // Checklist methods
  getChecklists(boardId: string, cardId: string): Checklist[] {
    const extras = this.getBoardExtras(boardId);
    return extras.checklists.filter((c) => c.cardId === cardId);
  }

  createChecklist(boardId: string, cardId: string, title: string): Checklist | null {
    const board = this.getBoardById(boardId);
    if (!board) return null;

    let cardExists = false;
    for (const column of board.columns) {
      if (column.cards.some((c) => c.id === cardId)) {
        cardExists = true;
        break;
      }
    }
    if (!cardExists) return null;

    const extras = this.getBoardExtras(boardId);
    const checklist: Checklist = {
      id: uuidv4(),
      title,
      cardId,
      items: [],
      createdAt: new Date().toISOString(),
    };
    extras.checklists.push(checklist);
    this.addActivity(boardId, cardId, 'checklist_added', {
      checklistId: checklist.id,
      checklistTitle: checklist.title,
    });
    return checklist;
  }

  deleteChecklist(boardId: string, cardId: string, checklistId: string): boolean {
    const extras = this.getBoardExtras(boardId);
    const index = extras.checklists.findIndex((c) => c.id === checklistId && c.cardId === cardId);
    if (index === -1) return false;
    extras.checklists.splice(index, 1);
    return true;
  }

  addChecklistItem(boardId: string, cardId: string, checklistId: string, title: string): Checklist | null {
    const extras = this.getBoardExtras(boardId);
    const checklist = extras.checklists.find((c) => c.id === checklistId && c.cardId === cardId);
    if (!checklist) return null;

    const item: ChecklistItem = {
      id: uuidv4(),
      title,
      isCompleted: false,
      order: checklist.items.length,
    };
    checklist.items.push(item);
    return checklist;
  }

  updateChecklistItem(
    boardId: string,
    cardId: string,
    checklistId: string,
    itemId: string,
    data: { title?: string; isCompleted?: boolean }
  ): Checklist | null {
    const extras = this.getBoardExtras(boardId);
    const checklist = extras.checklists.find((c) => c.id === checklistId && c.cardId === cardId);
    if (!checklist) return null;

    const item = checklist.items.find((i) => i.id === itemId);
    if (!item) return null;

    const wasCompleted = item.isCompleted;
    if (data.title !== undefined) item.title = data.title;
    if (data.isCompleted !== undefined) {
      item.isCompleted = data.isCompleted;
      if (data.isCompleted && !wasCompleted) {
        this.addActivity(boardId, cardId, 'checklist_item_completed', {
          checklistId: checklist.id,
          checklistTitle: checklist.title,
          itemId: item.id,
          itemTitle: item.title,
        });
      } else if (!data.isCompleted && wasCompleted) {
        this.addActivity(boardId, cardId, 'checklist_item_uncompleted', {
          checklistId: checklist.id,
          checklistTitle: checklist.title,
          itemId: item.id,
          itemTitle: item.title,
        });
      }
    }
    return checklist;
  }

  deleteChecklistItem(boardId: string, cardId: string, checklistId: string, itemId: string): boolean {
    const extras = this.getBoardExtras(boardId);
    const checklist = extras.checklists.find((c) => c.id === checklistId && c.cardId === cardId);
    if (!checklist) return false;

    const index = checklist.items.findIndex((i) => i.id === itemId);
    if (index === -1) return false;
    checklist.items.splice(index, 1);
    checklist.items.forEach((item, i) => (item.order = i));
    return true;
  }

  // Comment methods
  getComments(boardId: string, cardId: string): Comment[] {
    const extras = this.getBoardExtras(boardId);
    return extras.comments.filter((c) => c.cardId === cardId);
  }

  createComment(boardId: string, cardId: string, content: string): Comment | null {
    const board = this.getBoardById(boardId);
    if (!board) return null;

    let cardExists = false;
    for (const column of board.columns) {
      const card = column.cards.find((c) => c.id === cardId);
      if (card) {
        cardExists = true;
        card.commentCount = (card.commentCount || 0) + 1;
        break;
      }
    }
    if (!cardExists) return null;

    const user = this.getCurrentUser();
    const extras = this.getBoardExtras(boardId);
    const now = new Date().toISOString();
    const comment: Comment = {
      id: uuidv4(),
      cardId,
      content,
      author: { id: user.id, name: user.name, avatar: user.image },
      createdAt: now,
      updatedAt: now,
      isEdited: false,
    };
    extras.comments.push(comment);
    this.addActivity(boardId, cardId, 'comment_added', { commentId: comment.id, content });
    return comment;
  }

  updateComment(boardId: string, cardId: string, commentId: string, content: string): Comment | null {
    const extras = this.getBoardExtras(boardId);
    const comment = extras.comments.find((c) => c.id === commentId && c.cardId === cardId);
    if (!comment) return null;

    comment.content = content;
    comment.updatedAt = new Date().toISOString();
    comment.isEdited = true;
    return comment;
  }

  deleteComment(boardId: string, cardId: string, commentId: string): boolean {
    const board = this.getBoardById(boardId);
    const extras = this.getBoardExtras(boardId);
    const index = extras.comments.findIndex((c) => c.id === commentId && c.cardId === cardId);
    if (index === -1) return false;

    if (board) {
      for (const column of board.columns) {
        const card = column.cards.find((c) => c.id === cardId);
        if (card && card.commentCount) {
          card.commentCount = Math.max(0, card.commentCount - 1);
          break;
        }
      }
    }

    extras.comments.splice(index, 1);
    return true;
  }

  // Activity methods
  getCardActivities(boardId: string, cardId: string): Activity[] {
    const extras = this.getBoardExtras(boardId);
    return extras.activities.filter((a) => a.cardId === cardId);
  }

  getBoardActivities(boardId: string, limit?: number): Activity[] {
    const extras = this.getBoardExtras(boardId);
    const activities = [...extras.activities].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return limit ? activities.slice(0, limit) : activities;
  }
}

export const mockDb = new MockDatabase();
