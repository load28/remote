// T-13: named exported interface

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  createdAt: string;
  threadId: string;
}

// A-01: feature→feature 의존 금지 → User 타입 대신 필요한 형태만 정의
export interface MessageAuthor {
  displayName: string;
  avatarUrl: string;
}
