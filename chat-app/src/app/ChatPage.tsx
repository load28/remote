// 레퍼런스: interactive--event-naming--a11y.md, provider--context--error-boundary.md
// C-07: SRP — 페이지 레벨 조합 컴포넌트
// A-08: 단방향 데이터 흐름 (props down, events up)

import { useMemo, useState } from 'react';
import { ChannelList, useChannels } from '@/features/channel';
import { MessageList, MessageInput, useMessages, useSendMessage, type MessageAuthor } from '@/features/message';
import { UserProfile, useUsers, useCurrentUser } from '@/features/user';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

// ✅ P-03: 모듈 레벨 상수
const DEFAULT_CHANNEL_ID = 'channel-1';

export function ChatPage() {
  // ✅ S-09: 사용처 가까이 배치
  const [selectedChannelId, setSelectedChannelId] = useState(DEFAULT_CHANNEL_ID);

  const currentUserId = useCurrentUser((s) => s.currentUserId);
  const { data: channels = [] } = useChannels();
  const { data: users = [] } = useUsers();
  const { data: messages = [] } = useMessages(selectedChannelId);
  const sendMessage = useSendMessage(selectedChannelId);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);
  const currentUser = users.find((u) => u.id === currentUserId);

  // ✅ A-01: feature 간 의존 제거 — app 레벨에서 User→MessageAuthor 변환
  // ✅ P-14: 객체 의존성 useMemo
  const authorMap = useMemo(() => {
    const map: Record<string, MessageAuthor> = {};
    for (const user of users) {
      map[user.id] = { displayName: user.displayName, avatarUrl: user.avatarUrl };
    }
    return map;
  }, [users]);

  // ✅ N-03: handle 접두사
  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  const handleSendMessage = (content: string) => {
    sendMessage.mutate({ content, userId: currentUserId });
  };

  return (
    <div className="flex h-screen bg-white">
      {/* 사이드바 */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <header className="px-4 py-4 border-b border-gray-700">
          <h1 className="text-lg font-bold">Chat App</h1>
        </header>
        <div className="flex-1 overflow-y-auto py-3 px-2">
          {/* ✅ T-10: 위젯 레벨 에러 바운더리 */}
          <ErrorBoundary fallback={<p className="text-sm text-red-400 px-2">채널을 불러올 수 없습니다</p>}>
            <ChannelList
              channels={channels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={handleSelectChannel}
            />
          </ErrorBoundary>
        </div>
        {currentUser ? <UserProfile user={currentUser} /> : null}
      </aside>

      {/* 메인 채팅 영역 */}
      <main className="flex-1 flex flex-col">
        <header className="px-6 py-3 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedChannel ? `# ${selectedChannel.name}` : '채널을 선택하세요'}
          </h2>
          {selectedChannel ? (
            <p className="text-sm text-gray-500">{selectedChannel.description}</p>
          ) : null}
        </header>

        {/* ✅ T-10: 위젯 레벨 에러 바운더리 */}
        <ErrorBoundary
          fallback={(error, reset) => (
            <div className="flex-1 flex items-center justify-center" role="alert">
              <div className="text-center">
                <p className="text-gray-600 mb-2">메시지를 불러올 수 없습니다</p>
                <p className="text-sm text-gray-400 mb-4">{error.message}</p>
                <button
                  type="button"
                  onClick={reset}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}
        >
          <MessageList
            messages={messages}
            authorMap={authorMap}
            currentUserId={currentUserId}
          />
        </ErrorBoundary>

        <MessageInput
          onSendMessage={handleSendMessage}
          isSending={sendMessage.isPending}
        />
      </main>
    </div>
  );
}
