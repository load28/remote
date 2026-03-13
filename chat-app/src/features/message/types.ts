// T-13: named exported interface

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface SendMessageInput {
  channelId: string;
  content: string;
}
