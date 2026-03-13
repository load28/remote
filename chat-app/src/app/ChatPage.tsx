// 레퍼런스: interactive--event-naming--a11y.md, provider--context--error-boundary.md
// C-07: SRP — 페이지 레벨 조합 컴포넌트
// A-08: 단방향 데이터 흐름 (props down, events up)

import { useCallback, useMemo, useState } from 'react';
import { ChannelList, useChannels } from '@/features/channel';
import { MessageList, MessageInput, useMessages, useSendMessage, type MessageAuthor } from '@/features/message';
import { UserProfile, ProfileEditModal, useUsers, useUpdateProfile } from '@/features/user';
import type { UpdateProfileInput } from '@/features/user';
import {
  EmojiPicker,
  CustomEmojiManager,
  useCustomEmojis,
  useCreateCustomEmoji,
  useDeleteCustomEmoji,
  EMOJI_CATEGORIES,
} from '@/features/emoji';
import type { CustomEmoji, CreateCustomEmojiInput } from '@/features/emoji';
import { useAuthStore } from '@/features/auth';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

// ✅ P-03: 모듈 레벨 상수
const DEFAULT_CHANNEL_ID = 'channel-1';

export function ChatPage() {
  // ✅ S-09: 사용처 가까이 배치
  const [selectedChannelId, setSelectedChannelId] = useState(DEFAULT_CHANNEL_ID);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isCustomEmojiManagerOpen, setIsCustomEmojiManagerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');

  const currentUser = useAuthStore((s) => s.currentUser);
  const currentUserId = currentUser?.id ?? '';
  const { data: channels = [] } = useChannels();
  const { data: users = [] } = useUsers();
  const { data: messages = [] } = useMessages(selectedChannelId);
  const { data: customEmojis = [] } = useCustomEmojis();
  const sendMessage = useSendMessage(selectedChannelId);
  const updateProfile = useUpdateProfile(currentUserId);
  const createCustomEmoji = useCreateCustomEmoji(currentUserId);
  const deleteCustomEmoji = useDeleteCustomEmoji();

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);
  const currentUserDetail = users.find((u) => u.id === currentUserId);

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
    setMessageContent('');
  };

  const handleEditProfile = () => {
    setIsProfileEditOpen(true);
  };

  const handleCloseProfileEdit = () => {
    setIsProfileEditOpen(false);
  };

  const handleSubmitProfile = (input: UpdateProfileInput) => {
    updateProfile.mutate(input, {
      onSuccess: () => setIsProfileEditOpen(false),
    });
  };

  const handleSelectEmoji = (emoji: string) => {
    setMessageContent((prev) => prev + emoji);
    setIsEmojiPickerOpen(false);
  };

  const handleSelectCustomEmoji = (emoji: CustomEmoji) => {
    setMessageContent((prev) => prev + `:${emoji.name}:`);
    setIsEmojiPickerOpen(false);
  };

  const handleToggleEmojiPicker = useCallback(() => {
    setIsEmojiPickerOpen((prev) => !prev);
  }, []);

  const handleOpenCustomEmojiManager = () => {
    setIsEmojiPickerOpen(false);
    setIsCustomEmojiManagerOpen(true);
  };

  const handleCloseCustomEmojiManager = () => {
    setIsCustomEmojiManagerOpen(false);
  };

  const handleCreateCustomEmoji = (input: CreateCustomEmojiInput) => {
    createCustomEmoji.mutate(input);
  };

  const handleDeleteCustomEmoji = (id: string) => {
    deleteCustomEmoji.mutate(id);
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
        {currentUserDetail ? (
          <UserProfile user={currentUserDetail} onEditProfile={handleEditProfile} />
        ) : null}
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
          content={messageContent}
          onChangeContent={setMessageContent}
          onSendMessage={handleSendMessage}
          isSending={sendMessage.isPending}
          isEmojiPickerOpen={isEmojiPickerOpen}
          onToggleEmojiPicker={handleToggleEmojiPicker}
          emojiPicker={
            <EmojiPicker
              categories={EMOJI_CATEGORIES}
              customEmojis={customEmojis}
              onSelectEmoji={handleSelectEmoji}
              onSelectCustomEmoji={handleSelectCustomEmoji}
              onOpenCustomEmojiManager={handleOpenCustomEmojiManager}
            />
          }
        />
      </main>

      {/* 모달 */}
      {currentUserDetail ? (
        <ProfileEditModal
          user={currentUserDetail}
          isOpen={isProfileEditOpen}
          isSubmitting={updateProfile.isPending}
          onClose={handleCloseProfileEdit}
          onSubmitProfile={handleSubmitProfile}
        />
      ) : null}

      <CustomEmojiManager
        isOpen={isCustomEmojiManagerOpen}
        customEmojis={customEmojis}
        isCreating={createCustomEmoji.isPending}
        onClose={handleCloseCustomEmojiManager}
        onCreateEmoji={handleCreateCustomEmoji}
        onDeleteEmoji={handleDeleteCustomEmoji}
      />
    </div>
  );
}
