// 레퍼런스: interactive--event-naming--a11y.md, provider--context--error-boundary.md
// C-07: SRP — 페이지 레벨 조합 컴포넌트
// A-08: 단방향 데이터 흐름 (props down, events up)

import { useCallback, useMemo, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useQueryClient } from '@tanstack/react-query';
import { ChannelList, ChannelMemberPanel, useChannels } from '@/features/channel';
import { MessageList, MessageInput, MessageSearchBar, useMessages, useSendMessage, useMessageSearch, filterMessagesByQuery, MESSAGE_QUERY_KEY, type MessageAuthor, type Message } from '@/features/message';
import { UserProfile, ProfileEditModal, useUsers, useUpdateProfile, USER_QUERY_KEY, type UpdateProfileInput } from '@/features/user';
import { EmojiPicker, CustomEmojiManager, useCustomEmojis, useCreateCustomEmoji, useDeleteCustomEmoji, CUSTOM_EMOJI_QUERY_KEY, EMOJI_CATEGORIES, type CustomEmoji, type CreateCustomEmojiInput } from '@/features/emoji';
import { WorkspaceSwitcher, useWorkspaces, selectedWorkspaceIdAtom, selectWorkspaceAtom } from '@/features/workspace';
import { currentUserAtom, isGuestAtom, guestChannelIdAtom } from '@/features/auth';
import { ThreadPanel, ThreadIndicator, UnreadBadge, type ThreadAuthor } from '@/features/thread';
import { NotificationPanel, useNotifications, useReadNotification, useReadAllNotifications, isNotificationPanelOpenAtom, toggleNotificationPanelAtom, closeNotificationPanelAtom, getUnreadCount } from '@/features/notification';
import { PlanPanel } from '@/features/plan';
import { ContestExportPanel, useContestExport, useContestExportStore } from '@/features/contest-export';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { ChatChannelHeader } from '@/widgets/chat-header';
import { PendingThreadPanel } from '@/widgets/pending-thread';
import { useChatThread } from '../model/useChatThread';
import { useChatReadTracking } from '../model/useChatReadTracking';
import { useChatPlan } from '../model/useChatPlan';
import { ChatPlanSidebar } from '@/widgets/chat-sidebar';

// ✅ P-03: 모듈 레벨 상수
const DEFAULT_CHANNEL_ID = 'channel-1';
const DEFAULT_EMPTY_ARRAY: never[] = [];

// ✅ P-04: 중첩 삼항 금지 → 헬퍼 함수
function getVisibleChannels<T extends { id: string; workspaceId: string }>(
  channels: T[],
  isGuest: boolean,
  guestChannelId: string | null,
  workspaceId: string | null,
): T[] {
  if (isGuest) return channels.filter((c) => c.id === guestChannelId);
  if (workspaceId) return channels.filter((c) => c.workspaceId === workspaceId);
  return channels;
}

export function ChatPage() {
  const [selectedChannelId, setSelectedChannelId] = useState(DEFAULT_CHANNEL_ID);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isCustomEmojiManagerOpen, setIsCustomEmojiManagerOpen] = useState(false);
  const [isMemberPanelOpen, setIsMemberPanelOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');

  const queryClient = useQueryClient();
  const currentUser = useAtomValue(currentUserAtom);
  const isGuest = useAtomValue(isGuestAtom);
  const guestChannelId = useAtomValue(guestChannelIdAtom);
  const currentUserId = currentUser?.id ?? '';
  const { data: workspaces = DEFAULT_EMPTY_ARRAY } = useWorkspaces();
  const selectedWorkspaceId = useAtomValue(selectedWorkspaceIdAtom);
  const selectWorkspace = useSetAtom(selectWorkspaceAtom);
  const { data: channels = DEFAULT_EMPTY_ARRAY } = useChannels();
  const { data: users = DEFAULT_EMPTY_ARRAY } = useUsers();
  const effectiveWorkspaceId = selectedWorkspaceId ?? workspaces[0]?.id ?? null;
  const effectiveChannelId = isGuest && guestChannelId ? guestChannelId : selectedChannelId;

  const { data: messages = DEFAULT_EMPTY_ARRAY } = useMessages(effectiveChannelId);
  const { data: customEmojis = DEFAULT_EMPTY_ARRAY } = useCustomEmojis();
  const sendMessage = useSendMessage(effectiveChannelId);
  const updateProfile = useUpdateProfile(currentUserId);
  const createCustomEmoji = useCreateCustomEmoji(currentUserId);
  const deleteCustomEmoji = useDeleteCustomEmoji();

  // 커스텀 훅으로 분리된 스레드/읽음 추적/플랜 로직
  const thread = useChatThread(effectiveChannelId, currentUserId);
  const readTracking = useChatReadTracking(currentUserId);
  const plan = useChatPlan(effectiveChannelId, currentUserId);

  // 대회 export
  const isExportPanelOpen = useContestExportStore((s) => s.isExportPanelOpen);
  const toggleExportPanel = useContestExportStore((s) => s.toggleExportPanel);
  const closeExportPanel = useContestExportStore((s) => s.closeExportPanel);
  const { data: contestExportData = null, isLoading: isExportLoading } = useContestExport(effectiveChannelId, isExportPanelOpen);

  // 검색 (S-18: nuqs로 URL 상태 관리)
  const { searchQuery, handleSearch, handleClearSearch } = useMessageSearch();

  // 알림
  const { data: notifications = DEFAULT_EMPTY_ARRAY } = useNotifications(currentUserId);
  const readNotification = useReadNotification();
  const readAllNotifications = useReadAllNotifications();
  const isNotificationPanelOpen = useAtomValue(isNotificationPanelOpenAtom);
  const toggleNotificationPanel = useSetAtom(toggleNotificationPanelAtom);
  const closeNotificationPanel = useSetAtom(closeNotificationPanelAtom);
  const unreadNotificationCount = getUnreadCount(notifications);

  const handleReadNotification = (id: string) => {
    readNotification.mutate(id);
  };

  const handleReadAllNotifications = () => {
    readAllNotifications.mutate(currentUserId);
  };

  const selectedChannel = channels.find((c) => c.id === effectiveChannelId);
  const currentUserDetail = users.find((u) => u.id === currentUserId);
  const visibleChannels = getVisibleChannels(channels, isGuest, guestChannelId, effectiveWorkspaceId);

  const parentMessage = thread.getParentMessage(messages);
  const pendingMessage = thread.getPendingMessage(messages);

  const authorMap = useMemo(() => {
    const map: Record<string, MessageAuthor> = {};
    for (const user of users) {
      map[user.id] = { displayName: user.displayName, avatarUrl: user.avatarUrl };
    }
    return map;
  }, [users]);

  const threadAuthorMap = authorMap as Record<string, ThreadAuthor>;

  const messageThreadMap = useMemo(() => {
    const map: Record<string, typeof thread.channelThreads[number]> = {};
    for (const t of thread.channelThreads) {
      map[t.parentMessageId] = t;
    }
    return map;
  }, [thread.channelThreads]);

  const handleSelectWorkspace = (workspaceId: string) => {
    selectWorkspace(workspaceId);
    const firstChannel = channels.find((c) => c.workspaceId === workspaceId);
    if (firstChannel) setSelectedChannelId(firstChannel.id);
  };

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    thread.handleCloseThread();
    const channelMessages = messages.filter((m) => m.channelId === channelId);
    const lastMsg = channelMessages[channelMessages.length - 1];
    if (lastMsg) readTracking.handleMarkChannelAsRead(channelId, lastMsg.id);
  };

  const handleSendMessage = (content: string) => {
    sendMessage.mutate({ content, userId: currentUserId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [...MESSAGE_QUERY_KEY, effectiveChannelId] });
      },
    });
    setMessageContent('');
  };

  const renderThreadIndicator = useCallback(
    (message: Message) => {
      const t = messageThreadMap[message.id];
      if (!t) return null;
      return (
        <ThreadIndicator
          replyCount={t.replyCount}
          lastReplyAt={t.lastReplyAt}
          unreadCount={0}
          onOpenThread={() => thread.handleStartThread(message.id)}
        />
      );
    },
    [messageThreadMap, thread.handleStartThread],
  );

  const handleToggleEmojiPicker = useCallback(() => setIsEmojiPickerOpen((prev) => !prev), []);
  const handleSelectEmoji = (emoji: string) => { setMessageContent((prev) => prev + emoji); setIsEmojiPickerOpen(false); };
  const handleSelectCustomEmoji = (emoji: CustomEmoji) => { setMessageContent((prev) => prev + `:${emoji.name}:`); setIsEmojiPickerOpen(false); };
  const handleSubmitProfile = (input: UpdateProfileInput) => {
    updateProfile.mutate(input, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY }); setIsProfileEditOpen(false); } });
  };
  const handleCreateCustomEmoji = (input: CreateCustomEmojiInput) => {
    createCustomEmoji.mutate(input, { onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOM_EMOJI_QUERY_KEY }) });
  };
  const handleDeleteCustomEmoji = (id: string) => {
    deleteCustomEmoji.mutate(id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOM_EMOJI_QUERY_KEY }) });
  };

  return (
    <div className="flex h-screen bg-white">
      {!isGuest ? (
        <aside className="w-16 bg-gray-950 flex flex-col items-center">
          <ErrorBoundary fallback={<p className="text-xs text-red-400 p-1">오류</p>}>
            <WorkspaceSwitcher workspaces={workspaces} selectedWorkspaceId={effectiveWorkspaceId} onSelectWorkspace={handleSelectWorkspace} />
          </ErrorBoundary>
        </aside>
      ) : null}

      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <header className="px-4 py-4 border-b border-gray-700">
          <h1 className="text-lg font-bold">{workspaces.find((w) => w.id === effectiveWorkspaceId)?.name ?? 'Chat App'}</h1>
        </header>
        <div className="flex-1 overflow-y-auto py-3 px-2">
          <ErrorBoundary fallback={<p className="text-sm text-red-400 px-2">채널을 불러올 수 없습니다</p>}>
            <ChannelList channels={visibleChannels} selectedChannelId={effectiveChannelId} onSelectChannel={handleSelectChannel} />
            {visibleChannels.map((channel) => {
              const unread = readTracking.unreadCountMap[channel.id];
              if (!unread || unread.messageCount === 0) return null;
              return (
                <div key={`badge-${channel.id}`} className="px-2 -mt-8 flex justify-end pointer-events-none">
                  <UnreadBadge count={unread.messageCount} hasMention={unread.mentionCount > 0} />
                </div>
              );
            })}
          </ErrorBoundary>
        </div>
        <ChatPlanSidebar {...plan.sidebarProps} />
        {currentUserDetail ? <UserProfile user={currentUserDetail} onEditProfile={() => setIsProfileEditOpen(true)} /> : null}
      </aside>

      <main className="flex-1 flex flex-col">
        <ChatChannelHeader selectedChannel={selectedChannel} isGuest={isGuest} unreadNotificationCount={unreadNotificationCount} onToggleMemberPanel={() => setIsMemberPanelOpen((prev) => !prev)} onToggleNotificationPanel={toggleNotificationPanel} onToggleExportPanel={toggleExportPanel} />
        <MessageSearchBar searchQuery={searchQuery} onSearch={handleSearch} onClear={handleClearSearch} />
        <ErrorBoundary
          fallback={(error, reset) => (
            <div className="flex-1 flex items-center justify-center" role="alert">
              <div className="text-center">
                <p className="text-gray-600 mb-2">메시지를 불러올 수 없습니다</p>
                <p className="text-sm text-gray-400 mb-4">{error.message}</p>
                <button type="button" onClick={reset} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">다시 시도</button>
              </div>
            </div>
          )}
        >
          <MessageList messages={filterMessagesByQuery(messages, searchQuery)} authorMap={authorMap} currentUserId={currentUserId} threadIndicatorRenderer={renderThreadIndicator} onStartThread={thread.handleStartThread} />
        </ErrorBoundary>
        <MessageInput
          content={messageContent} onChangeContent={setMessageContent} onSendMessage={handleSendMessage}
          isSending={sendMessage.isPending} isEmojiPickerOpen={isEmojiPickerOpen} onToggleEmojiPicker={handleToggleEmojiPicker}
          emojiPicker={<EmojiPicker categories={EMOJI_CATEGORIES} customEmojis={customEmojis} onSelectEmoji={handleSelectEmoji} onSelectCustomEmoji={handleSelectCustomEmoji} onOpenCustomEmojiManager={() => { setIsEmojiPickerOpen(false); setIsCustomEmojiManagerOpen(true); }} />}
        />
      </main>

      {isMemberPanelOpen && selectedChannel ? (
        <ChannelMemberPanel
          channelId={effectiveChannelId}
          channelName={selectedChannel.name}
          currentUserId={currentUserId}
          allUsers={users}
          onClose={() => setIsMemberPanelOpen(false)}
        />
      ) : null}

      {thread.isThreadPanelOpen && thread.activeThread ? (
        <ThreadPanel
          thread={thread.activeThread}
          replies={thread.threadReplies}
          authorMap={threadAuthorMap}
          currentUserId={currentUserId}
          parentInfo={{
            content: parentMessage?.content ?? '',
            authorName: parentMessage ? (authorMap[parentMessage.userId]?.displayName ?? '알 수 없음') : '',
          }}
          permissions={{
            canReply: thread.replyPermission.allowed,
            replyBlockedReason: thread.replyPermission.reason,
            canLock: thread.hasLockPermission,
            canUnlock: thread.hasUnlockPermission,
          }}
          onAction={{
            onReply: thread.handleReplyToThread,
            onLock: thread.handleLockThread,
            onUnlock: thread.handleUnlockThread,
            onClose: thread.handleCloseThread,
            isReplying: thread.isReplying,
          }}
        />
      ) : null}

      {thread.isThreadPanelOpen && thread.isPendingThread && pendingMessage ? (
        <PendingThreadPanel
          messageContent={pendingMessage.content}
          authorName={authorMap[pendingMessage.userId]?.displayName ?? '알 수 없음'}
          isCreating={thread.isCreatingThread}
          onReply={thread.handleReplyToThread}
          onClose={thread.handleCloseThread}
        />
      ) : null}

      {plan.isPlanPanelOpen && plan.activePlan ? (
        <PlanPanel plan={plan.activePlan} permissions={plan.permissions} onAction={plan.panelActions} />
      ) : null}

      {isExportPanelOpen ? (
        <ContestExportPanel
          channelName={selectedChannel?.name ?? ''}
          exportData={contestExportData}
          isLoading={isExportLoading}
          onClose={closeExportPanel}
        />
      ) : null}

      {isNotificationPanelOpen ? (
        <NotificationPanel
          notifications={notifications}
          onReadNotification={handleReadNotification}
          onReadAll={handleReadAllNotifications}
          onClose={closeNotificationPanel}
        />
      ) : null}

      {currentUserDetail ? (
        <ProfileEditModal user={currentUserDetail} isOpen={isProfileEditOpen} isSubmitting={updateProfile.isPending} onClose={() => setIsProfileEditOpen(false)} onSubmitProfile={handleSubmitProfile} />
      ) : null}
      <CustomEmojiManager isOpen={isCustomEmojiManagerOpen} customEmojis={customEmojis} isCreating={createCustomEmoji.isPending} onClose={() => setIsCustomEmojiManagerOpen(false)} onCreateEmoji={handleCreateCustomEmoji} onDeleteEmoji={handleDeleteCustomEmoji} />
    </div>
  );
}
