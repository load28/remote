// A-07: barrel file public API만 노출, P-06: named export만
export { MessageList, type MessageAuthor } from './components/MessageList';
export { MessageInput } from './components/MessageInput';
export { useMessages, useSendMessage } from './hooks/useMessages';
export type { Message, SendMessageInput } from './types';
