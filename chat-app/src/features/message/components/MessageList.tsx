// 레퍼런스: cleanup--useEffect--event-listener--abort--web-socket.md
// S-11: 렌더에 안 쓰이는 값 ref, S-16: useEffect cleanup

import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import type { Message } from '../types';

// ✅ A-01: feature→feature 의존 금지 → User 타입 대신 필요한 형태만 정의
export interface MessageAuthor {
  displayName: string;
  avatarUrl: string;
}

// ✅ T-13: named exported interface
export interface MessageListProps {
  messages: Message[];
  authorMap: Record<string, MessageAuthor>;
  currentUserId: string;
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function MessageList({ messages, authorMap, currentUserId }: MessageListProps) {
  // ✅ S-11: 스크롤 위치는 UI에 표시 안 됨 → ref
  const bottomRef = useRef<HTMLDivElement>(null);

  // ✅ S-16: cleanup은 여기서 불필요 (scrollIntoView는 구독 아님)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <section aria-label="메시지 목록" className="flex-1 overflow-y-auto">
      <div className="py-4">
        {messages.map((message) => {
          const author = authorMap[message.userId];
          return (
            <MessageItem
              key={message.id}
              content={message.content}
              authorName={author?.displayName ?? '알 수 없음'}
              avatarUrl={author?.avatarUrl ?? ''}
              timestamp={message.createdAt}
              isOwnMessage={message.userId === currentUserId}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}
