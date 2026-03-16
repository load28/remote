// S-11: 렌더에 안 쓰이는 값 ref, S-16: useEffect cleanup

import { useEffect, useRef, type ReactNode } from 'react';
import { MessageItem } from './MessageItem';
import type { Message, MessageAuthor } from '../model/types';

// T-13: named exported interface
export interface MessageListProps {
  messages: Message[];
  authorMap: Record<string, MessageAuthor>;
  currentUserId: string;
  threadIndicatorRenderer: (message: Message) => ReactNode;
  onStartThread: (messageId: string) => void;
}

// C-10: 파일당 1 exported 컴포넌트
export function MessageList({
  messages,
  authorMap,
  currentUserId,
  threadIndicatorRenderer,
  onStartThread,
}: MessageListProps) {
  // S-11: 스크롤 위치는 UI에 표시 안 됨 → ref
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // S-16 예외: 동기적 DOM 조작 — 구독/타이머 없음
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <section aria-label="메시지 목록" className="flex-1 overflow-y-auto">
      <div className="py-4">
        {messages.map((message) => {
          const author = authorMap[message.userId];
          const hasThread = message.threadId !== '';
          return (
            <MessageItem
              key={message.id}
              content={message.content}
              authorName={author?.displayName ?? '알 수 없음'}
              avatarUrl={author?.avatarUrl ?? ''}
              timestamp={message.createdAt}
              isOwnMessage={message.userId === currentUserId}
              thread={{
                hasThread,
                onStartThread: () => onStartThread(message.id),
                indicator: threadIndicatorRenderer(message),
              }}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}
