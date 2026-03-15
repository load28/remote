// T-14: discriminated union for NotificationType
// T-15: optional 남용 금지 — 타입별 필드를 discriminated union으로 분리

// --- 알림 타입 구분자 ---

export type NotificationType = 'message' | 'mention' | 'thread_reply' | 'channel_invite';

// --- 알림 discriminated union ---
// ✅ T-14: type 필드로 구분, 타입별 다른 필드 조합

export type Notification =
  | {
      type: 'message';
      id: string;
      channelId: string;
      channelName: string;
      senderName: string;
      preview: string;
      isRead: boolean;
      createdAt: string;
    }
  | {
      type: 'mention';
      id: string;
      channelId: string;
      channelName: string;
      senderName: string;
      preview: string;
      isRead: boolean;
      createdAt: string;
    }
  | {
      type: 'thread_reply';
      id: string;
      channelId: string;
      threadId: string;
      senderName: string;
      preview: string;
      isRead: boolean;
      createdAt: string;
    }
  | {
      type: 'channel_invite';
      id: string;
      channelId: string;
      channelName: string;
      inviterName: string;
      isRead: boolean;
      createdAt: string;
    };
