// 레퍼런스: interactive--event-naming--a11y.md, provider--context--error-boundary.md
// C-07: SRP — 페이지 레벨 조합 컴포넌트
// A-08: 단방향 데이터 흐름 (props down, events up)
// S-17: mutation 후속 로직은 사용처에서 처리

import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChannelList, useChannels } from '@/features/channel';
import { MessageList, MessageInput, useMessages, useSendMessage, MESSAGE_QUERY_KEY, type MessageAuthor } from '@/features/message';
import { UserProfile, ProfileEditModal, useUsers, useUpdateProfile, USER_QUERY_KEY } from '@/features/user';
import type { UpdateProfileInput } from '@/features/user';
import {
  EmojiPicker,
  CustomEmojiManager,
  useCustomEmojis,
  useCreateCustomEmoji,
  useDeleteCustomEmoji,
  CUSTOM_EMOJI_QUERY_KEY,
  EMOJI_CATEGORIES,
} from '@/features/emoji';
import type { CustomEmoji, CreateCustomEmojiInput } from '@/features/emoji';
import { WorkspaceSwitcher, useWorkspaces, useWorkspaceStore } from '@/features/workspace';
import { useAuthStore } from '@/features/auth';
import {
  ThreadPanel,
  ThreadIndicator,
  UnreadBadge,
  useChannelThreads,
  useThreadReplies,
  useCreateThread,
  useReplyToThread,
  useLockThread,
  useUnlockThread,
  useUnreadCounts,
  useMarkAsRead,
  useMarkThreadAsRead,
  useThreadStore,
  canReplyToThread,
  canLockThread,
  canUnlockThread,
  THREAD_QUERY_KEY,
  THREAD_REPLIES_QUERY_KEY,
  UNREAD_COUNTS_QUERY_KEY,
  type ThreadAuthor,
} from '@/features/thread';
import type { Message } from '@/features/message';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { ChatChannelHeader } from './components/ChatChannelHeader';

// ✅ P-03: 모듈 레벨 상수
const DEFAULT_CHANNEL_ID = 'channel-1';

// ✅ P-04: 중첩 삼항 금지 → 헬퍼 함수로 분리
function getVisibleChannels(
  channels: { id: string; workspaceId: string }[],
  isGuest: boolean,
  guestChannelId: string | null,
  workspaceId: string | null,
) {
  if (isGuest) {
    return channels.filter((c) => c.id === guestChannelId);
  }
  if (workspaceId) {
    return channels.filter((c) => c.workspaceId === workspaceId);
  }
  return channels;
}

export function ChatPage() {
  // ✅ S-09: 사용처 가까이 배치
  const [selectedChannelId, setSelectedChannelId] = useState(DEFAULT_CHANNEL_ID);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isCustomEmojiManagerOpen, setIsCustomEmojiManagerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');

  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.currentUser);
  const isGuest = useAuthStore((s) => s.isGuest);
  const guestChannelId = useAuthStore((s) => s.guestChannelId);
  const currentUserId = currentUser?.id ?? '';
  const { data: workspaces = [] } = useWorkspaces();
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const { data: channels = [] } = useChannels();
  const { data: users = [] } = useUsers();

  const effectiveWorkspaceId = selectedWorkspaceId ?? workspaces[0]?.id ?? null;
  const effectiveChannelId = isGuest && guestChannelId ? guestChannelId : selectedChannelId;

  const { data: messages = [] } = useMessages(effectiveChannelId);
  const { data: customEmojis = [] } = useCustomEmojis();
  const sendMessage = useSendMessage(effectiveChannelId);
  const updateProfile = useUpdateProfile(currentUserId);
  const createCustomEmoji = useCreateCustomEmoji(currentUserId);
  const deleteCustomEmoji = useDeleteCustomEmoji();

  // --- Thread ---
  const activeThreadId = useThreadStore((s) => s.activeThreadId);
  const isThreadPanelOpen = useThreadStore((s) => s.isThreadPanelOpen);
  const openThread = useThreadStore((s) => s.openThread);
  const closeThread = useThreadStore((s) => s.closeThread);

  const { data: channelThreads = [] } = useChannelThreads(effectiveChannelId);
  const { data: threadReplies = [] } = useThreadReplies(activeThreadId ?? '');
  const createThread = useCreateThread(currentUserId);
  const replyToThread = useReplyToThread(currentUserId);
  const lockThread = useLockThread(currentUserId);
  const unlockThread = useUnlockThread(currentUserId);

  // --- 읽음 추적 ---
  const { data: unreadCounts = [] } = useUnreadCounts(currentUserId);
  const markAsRead = useMarkAsRead(currentUserId);
  const markThreadAsRead = useMarkThreadAsRead(currentUserId);

  const selectedChannel = channels.find((c) => c.id === effectiveChannelId);
  const currentUserDetail = users.find((u) => u.id === currentUserId);

  const visibleChannels = getVisibleChannels(channels, isGuest, guestChannelId, effectiveWorkspaceId);

  // 현재 활성 스레드 정보
  const activeThread = channelThreads.find((t) => t.id === activeThreadId);
  // 스레드의 원본 메시지
  const parentMessage = activeThread
    ? messages.find((m) => m.id === activeThread.parentMessageId)
    : undefined;

  // ✅ A-01: feature 간 의존 제거 — app 레벨에서 User→MessageAuthor 변환
  // ✅ P-14: 객체 의존성 useMemo
  const authorMap = useMemo(() => {
    const map: Record<string, MessageAuthor> = {};
    for (const user of users) {
      map[user.id] = { displayName: user.displayName, avatarUrl: user.avatarUrl };
    }
    return map;
  }, [users]);

  // Thread용 authorMap도 동일 구조 (ThreadAuthor와 MessageAuthor 동일 shape)
  const threadAuthorMap = useMemo(() => {
    const map: Record<string, ThreadAuthor> = {};
    for (const user of users) {
      map[user.id] = { displayName: user.displayName, avatarUrl: user.avatarUrl };
    }
    return map;
  }, [users]);

  // 메시지별 스레드 맵 (빠른 조회용)
  const messageThreadMap = useMemo(() => {
    const map: Record<string, typeof channelThreads[number]> = {};
    for (const thread of channelThreads) {
      map[thread.parentMessageId] = thread;
    }
    return map;
  }, [channelThreads]);

  // 채널별 미읽음 수 맵
  const unreadCountMap = useMemo(() => {
    const map: Record<string, { messageCount: number; mentionCount: number }> = {};
    for (const uc of unreadCounts) {
      map[uc.channelId] = { messageCount: uc.messageCount, mentionCount: uc.mentionCount };
    }
    return map;
  }, [unreadCounts]);

  // 비즈니스 로직 계산
  const replyPermission = activeThread
    ? canReplyToThread(activeThread, currentUserId)
    : { allowed: false, reason: '' };
  const hasLockPermission = activeThread ? canLockThread(activeThread, currentUserId) : false;
  const hasUnlockPermission = activeThread ? canUnlockThread(activeThread, currentUserId) : false;

  // ✅ N-03: handle 접두사
  const handleSelectWorkspace = (workspaceId: string) => {
    selectWorkspace(workspaceId);
    const firstChannel = channels.find((c) => c.workspaceId === workspaceId);
    if (firstChannel) {
      setSelectedChannelId(firstChannel.id);
    }
  };

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    closeThread();
    // 읽음 처리: 채널 전환 시 마지막 메시지를 읽음 처리
    const channelMessages = messages.filter((m) => m.channelId === channelId);
    const lastMessage = channelMessages[channelMessages.length - 1];
    if (lastMessage) {
      markAsRead.mutate(
        { channelId, messageId: lastMessage.id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_QUERY_KEY });
          },
        },
      );
    }
  };

  // ✅ S-17: onSuccess를 사용처에서 처리
  const handleSendMessage = (content: string) => {
    sendMessage.mutate({ content, userId: currentUserId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [...MESSAGE_QUERY_KEY, effectiveChannelId] });
        queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_QUERY_KEY });
      },
    });
    setMessageContent('');
  };

  const handleStartThread = (messageId: string) => {
    // 이미 스레드가 있으면 열기
    const existingThread = channelThreads.find((t) => t.parentMessageId === messageId);
    if (existingThread) {
      openThread(existingThread.id);
      return;
    }
    // 새 스레드 생성 모달 대신 바로 패널 열기 — 첫 답장 시 스레드 생성
    openThread(`pending-${messageId}`);
  };

  const handleReplyToThread = (content: string) => {
    if (!activeThreadId) return;

    // pending 스레드 (아직 서버에 생성 안 됨) → 스레드 생성
    if (activeThreadId.startsWith('pending-')) {
      const messageId = activeThreadId.replace('pending-', '');
      createThread.mutate(
        { parentMessageId: messageId, channelId: effectiveChannelId, content },
        {
          onSuccess: (newThread) => {
            queryClient.invalidateQueries({ queryKey: [...THREAD_QUERY_KEY, effectiveChannelId] });
            queryClient.invalidateQueries({ queryKey: [...MESSAGE_QUERY_KEY, effectiveChannelId] });
            openThread(newThread.id);
          },
        },
      );
      return;
    }

    replyToThread.mutate(
      { threadId: activeThreadId, content },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [...THREAD_REPLIES_QUERY_KEY, activeThreadId] });
          queryClient.invalidateQueries({ queryKey: [...THREAD_QUERY_KEY, effectiveChannelId] });
          // 답장 후 읽음 처리
          const lastReply = threadReplies[threadReplies.length - 1];
          if (lastReply) {
            markThreadAsRead.mutate(
              { threadId: activeThreadId, replyId: lastReply.id },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_QUERY_KEY });
                },
              },
            );
          }
        },
      },
    );
  };

  const handleLockThread = (reason: string) => {
    if (!activeThreadId) return;
    lockThread.mutate(
      { threadId: activeThreadId, reason },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [...THREAD_QUERY_KEY, effectiveChannelId] });
          queryClient.invalidateQueries({ queryKey: [...THREAD_QUERY_KEY, 'detail', activeThreadId] });
        },
      },
    );
  };

  const handleUnlockThread = () => {
    if (!activeThreadId) return;
    unlockThread.mutate(activeThreadId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [...THREAD_QUERY_KEY, effectiveChannelId] });
        queryClient.invalidateQueries({ queryKey: [...THREAD_QUERY_KEY, 'detail', activeThreadId] });
      },
    });
  };

  const handleCloseThread = () => {
    closeThread();
  };

  // 스레드 인디케이터 렌더러 — app 레벨에서 조합 (A-01)
  const renderThreadIndicator = useCallback(
    (message: Message) => {
      const thread = messageThreadMap[message.id];
      if (!thread) return null;
      return (
        <ThreadIndicator
          replyCount={thread.replyCount}
          lastReplyAt={thread.lastReplyAt}
          unreadCount={0}
          onOpenThread={() => openThread(thread.id)}
        />
      );
    },
    [messageThreadMap, openThread],
  );

  const handleEditProfile = () => {
    setIsProfileEditOpen(true);
  };

  const handleCloseProfileEdit = () => {
    setIsProfileEditOpen(false);
  };

  const handleSubmitProfile = (input: UpdateProfileInput) => {
    updateProfile.mutate(input, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
        setIsProfileEditOpen(false);
      },
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
    createCustomEmoji.mutate(input, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: CUSTOM_EMOJI_QUERY_KEY });
      },
    });
  };

  const handleDeleteCustomEmoji = (id: string) => {
    deleteCustomEmoji.mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: CUSTOM_EMOJI_QUERY_KEY });
      },
    });
  };

  // pending 스레드인지 확인
  const isPendingThread = activeThreadId?.startsWith('pending-') ?? false;
  const pendingMessageId = isPendingThread ? activeThreadId?.replace('pending-', '') : undefined;
  const pendingMessage = pendingMessageId ? messages.find((m) => m.id === pendingMessageId) : undefined;

  return (
    <div className="flex h-screen bg-white">
      {/* 워크스페이스 바 */}
      {!isGuest ? (
        <aside className="w-16 bg-gray-950 flex flex-col items-center">
          <ErrorBoundary fallback={<p className="text-xs text-red-400 p-1">오류</p>}>
            <WorkspaceSwitcher
              workspaces={workspaces}
              selectedWorkspaceId={effectiveWorkspaceId}
              onSelectWorkspace={handleSelectWorkspace}
            />
          </ErrorBoundary>
        </aside>
      ) : null}

      {/* 채널 사이드바 */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <header className="px-4 py-4 border-b border-gray-700">
          <h1 className="text-lg font-bold">
            {workspaces.find((w) => w.id === effectiveWorkspaceId)?.name ?? 'Chat App'}
          </h1>
        </header>
        <div className="flex-1 overflow-y-auto py-3 px-2">
          <ErrorBoundary fallback={<p className="text-sm text-red-400 px-2">채널을 불러올 수 없습니다</p>}>
            <ChannelList
              channels={visibleChannels}
              selectedChannelId={effectiveChannelId}
              onSelectChannel={handleSelectChannel}
            />
            {/* 채널별 미읽음 배지 오버레이 */}
            {visibleChannels.map((channel) => {
              const unread = unreadCountMap[channel.id];
              if (!unread || unread.messageCount === 0) return null;
              return (
                <div key={`badge-${channel.id}`} className="px-2 -mt-8 flex justify-end pointer-events-none">
                  <UnreadBadge count={unread.messageCount} hasMention={unread.mentionCount > 0} />
                </div>
              );
            })}
          </ErrorBoundary>
        </div>
        {currentUserDetail ? (
          <UserProfile user={currentUserDetail} onEditProfile={handleEditProfile} />
        ) : null}
      </aside>

      {/* 메인 채팅 영역 */}
      <main className="flex-1 flex flex-col">
        <ChatChannelHeader selectedChannel={selectedChannel} isGuest={isGuest} />

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
            threadIndicatorRenderer={renderThreadIndicator}
            onStartThread={handleStartThread}
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

      {/* 스레드 패널 */}
      {isThreadPanelOpen && activeThread ? (
        <ThreadPanel
          thread={activeThread}
          replies={threadReplies}
          authorMap={threadAuthorMap}
          currentUserId={currentUserId}
          parentMessageContent={parentMessage?.content ?? ''}
          parentMessageAuthorName={parentMessage ? (authorMap[parentMessage.userId]?.displayName ?? '알 수 없음') : ''}
          isReplying={replyToThread.isPending}
          canReply={replyPermission.allowed}
          replyBlockedReason={replyPermission.reason}
          canLock={hasLockPermission}
          canUnlock={hasUnlockPermission}
          onReply={handleReplyToThread}
          onLock={handleLockThread}
          onUnlock={handleUnlockThread}
          onClose={handleCloseThread}
        />
      ) : null}

      {/* pending 스레드 패널 — 아직 서버에 없는 새 스레드 */}
      {isThreadPanelOpen && isPendingThread && pendingMessage ? (
        <aside className="w-96 border-l border-gray-200 flex flex-col bg-white" aria-label="새 스레드">
          <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-sm">새 스레드</h2>
            <button
              type="button"
              onClick={handleCloseThread}
              className="text-gray-400 hover:text-gray-600"
              aria-label="스레드 닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </header>
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">
              {authorMap[pendingMessage.userId]?.displayName ?? '알 수 없음'}
            </p>
            <p className="text-sm text-gray-800">{pendingMessage.content}</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">첫 번째 답장을 입력하여 스레드를 시작하세요.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('reply') as HTMLTextAreaElement;
              const trimmed = input.value.trim();
              if (trimmed.length === 0) return;
              handleReplyToThread(trimmed);
              input.value = '';
            }}
            className="border-t border-gray-200 p-3"
          >
            <div className="flex gap-2 items-end">
              <textarea
                name="reply"
                placeholder="답장을 입력하세요..."
                rows={1}
                className="flex-1 resize-none rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                aria-label="첫 답장 입력"
                disabled={createThread.isPending}
              />
              <button
                type="submit"
                disabled={createThread.isPending}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {createThread.isPending ? '생성 중...' : '스레드 시작'}
              </button>
            </div>
          </form>
        </aside>
      ) : null}

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
