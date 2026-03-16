// A-07: barrel file — FSD: entities에서 re-export + feature 전용 export
// P-06: named export만

// entities/message에서 re-export (도메인 모델)
export { MessageList, MessageItem, useMessages, MESSAGE_QUERY_KEY } from '@/entities/message';
export type { Message, MessageAuthor, MessageListProps, MessageItemProps, MessageThreadInfo } from '@/entities/message';

// feature 전용 (사용자 인터랙션)
export { useSendMessage } from './hooks/useMessages';
export { MessageInput } from './components/MessageInput';
export { MessageSearchBar } from './components/MessageSearchBar';
export type { MessageSearchBarProps } from './components/MessageSearchBar';
export { useMessageSearch } from './hooks/useMessageSearch';
export { filterMessagesByQuery } from './domain/messageSearch';
export type { SendMessageInput } from './types';
