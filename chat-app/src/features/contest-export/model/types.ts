// T-13: named exported interface
// T-15: optional 남용 금지 — 모든 필드 필수

// --- Export 포맷 ---

export type ExportFormat = 'json' | 'csv' | 'markdown';

// --- Export 데이터 구조 ---

export interface ContestExportMessage {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  createdAt: string;
}

export interface ContestExportThread {
  id: string;
  parentMessageContent: string;
  createdBy: string;
  createdAt: string;
  replyCount: number;
  replies: ContestExportReply[];
}

export interface ContestExportReply {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  createdAt: string;
}

export interface ContestExportPlanItem {
  content: string;
  isCompleted: boolean;
}

export interface ContestExportPlan {
  id: string;
  title: string;
  createdBy: string;
  createdAt: string;
  items: ContestExportPlanItem[];
}

export interface ContestExportData {
  channelName: string;
  exportedAt: string;
  messages: ContestExportMessage[];
  threads: ContestExportThread[];
  plans: ContestExportPlan[];
}

// --- API 입력 타입 ---

export interface ContestExportInput {
  channelId: string;
}
