// A-05: 비즈니스 로직 분리 — React 미사용 순수 함수
// P-03: 모듈 레벨 상수

import type {
  ContestExportData,
  ContestExportMessage,
  ContestExportThread,
  ContestExportPlan,
  ExportFormat,
} from './types';

// ✅ P-03, N-06: 모듈 레벨 상수
const CSV_SEPARATOR = ',';
const CSV_NEWLINE = '\n';

// --- JSON 포맷 ---

function formatAsJson(exportData: ContestExportData): string {
  return JSON.stringify(exportData, null, 2);
}

// --- CSV 포맷 ---

function escapeCsvField(field: string): string {
  if (field.includes(CSV_SEPARATOR) || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function formatMessagesAsCsv(messages: ContestExportMessage[]): string {
  const header = ['ID', '작성자', '내용', '작성일시'].join(CSV_SEPARATOR);
  const rows = messages.map((msg) =>
    [msg.id, escapeCsvField(msg.displayName), escapeCsvField(msg.content), msg.createdAt].join(CSV_SEPARATOR),
  );
  return [header, ...rows].join(CSV_NEWLINE);
}

function formatAsCsv(exportData: ContestExportData): string {
  const sections: string[] = [];

  sections.push(`# 채널: ${exportData.channelName}`);
  sections.push(`# 내보내기 일시: ${exportData.exportedAt}`);
  sections.push('');
  sections.push('## 메시지');
  sections.push(formatMessagesAsCsv(exportData.messages));

  return sections.join(CSV_NEWLINE);
}

// --- Markdown 포맷 ---

function formatMessageAsMarkdown(msg: ContestExportMessage): string {
  return `- **${msg.displayName}** (${msg.createdAt}): ${msg.content}`;
}

function formatThreadAsMarkdown(thread: ContestExportThread): string {
  const replies = thread.replies
    .map((reply) => `  - **${reply.displayName}** (${reply.createdAt}): ${reply.content}`)
    .join('\n');
  return `### 스레드: ${thread.parentMessageContent}\n- 작성자: ${thread.createdBy} | 답글 ${thread.replyCount}개\n${replies}`;
}

function formatPlanAsMarkdown(plan: ContestExportPlan): string {
  const items = plan.items
    .map((planItem) => `  - [${planItem.isCompleted ? 'x' : ' '}] ${planItem.content}`)
    .join('\n');
  return `### ${plan.title}\n- 작성자: ${plan.createdBy} | ${plan.createdAt}\n${items}`;
}

function formatAsMarkdown(exportData: ContestExportData): string {
  const sections: string[] = [];

  sections.push(`# 대회 Export: ${exportData.channelName}`);
  sections.push(`> 내보내기 일시: ${exportData.exportedAt}`);
  sections.push('');

  sections.push('## 메시지');
  if (exportData.messages.length > 0) {
    sections.push(exportData.messages.map(formatMessageAsMarkdown).join('\n'));
  } else {
    sections.push('_메시지 없음_');
  }
  sections.push('');

  sections.push('## 스레드');
  if (exportData.threads.length > 0) {
    sections.push(exportData.threads.map(formatThreadAsMarkdown).join('\n\n'));
  } else {
    sections.push('_스레드 없음_');
  }
  sections.push('');

  sections.push('## 플랜');
  if (exportData.plans.length > 0) {
    sections.push(exportData.plans.map(formatPlanAsMarkdown).join('\n\n'));
  } else {
    sections.push('_플랜 없음_');
  }

  return sections.join('\n');
}

// --- Public API ---

export function formatContestExport(exportData: ContestExportData, format: ExportFormat): string {
  switch (format) {
    case 'json':
      return formatAsJson(exportData);
    case 'csv':
      return formatAsCsv(exportData);
    case 'markdown':
      return formatAsMarkdown(exportData);
  }
}

export function getExportFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'json':
      return 'json';
    case 'csv':
      return 'csv';
    case 'markdown':
      return 'md';
  }
}

export function getExportMimeType(format: ExportFormat): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'csv':
      return 'text/csv';
    case 'markdown':
      return 'text/markdown';
  }
}

export function buildExportFileName(channelName: string, format: ExportFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const extension = getExportFileExtension(format);
  return `contest-export-${channelName}-${timestamp}.${extension}`;
}
