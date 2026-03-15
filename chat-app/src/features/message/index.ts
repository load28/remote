// A-07: barrel file public API만 노출, P-06: named export만
export { MessageList, type MessageAuthor, type MessageListProps } from './components/MessageList';
export { type MessageThreadInfo } from './components/MessageItem';
export { MessageInput } from './components/MessageInput';
export { MessageSearchBar, type MessageSearchBarProps } from './components/MessageSearchBar';
export { useMessages, useSendMessage, MESSAGE_QUERY_KEY } from './hooks/useMessages';
export { useMessageSearch } from './hooks/useMessageSearch';
export { filterMessagesByQuery } from './domain/messageSearch';
export type { Message, SendMessageInput } from './types';
