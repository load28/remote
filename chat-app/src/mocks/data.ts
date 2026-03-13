import type { User } from '@/features/user/types';
import type { Channel } from '@/features/channel/types';
import type { Message } from '@/features/message/types';

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    username: 'jimin',
    displayName: '박지민',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=jimin',
    statusMessage: '열심히 코딩 중!',
    isOnline: true,
  },
  {
    id: 'user-2',
    username: 'soyeon',
    displayName: '김소연',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=soyeon',
    statusMessage: '회의 중',
    isOnline: true,
  },
  {
    id: 'user-3',
    username: 'minho',
    displayName: '이민호',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=minho',
    statusMessage: '',
    isOnline: false,
  },
  {
    id: 'user-4',
    username: 'yuna',
    displayName: '정유나',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=yuna',
    statusMessage: '점심 시간',
    isOnline: true,
  },
];

export const MOCK_CHANNELS: Channel[] = [
  {
    id: 'channel-1',
    name: 'general',
    description: '일반 대화 채널',
    isPrivate: false,
    memberCount: 4,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'channel-2',
    name: 'random',
    description: '자유로운 대화',
    isPrivate: false,
    memberCount: 4,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'channel-3',
    name: 'dev',
    description: '개발 관련 논의',
    isPrivate: false,
    memberCount: 3,
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'channel-4',
    name: 'design',
    description: '디자인 관련 논의',
    isPrivate: true,
    memberCount: 2,
    createdAt: '2024-01-03T00:00:00Z',
  },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    channelId: 'channel-1',
    userId: 'user-1',
    content: '안녕하세요! 오늘 미팅 몇 시에 시작하나요?',
    createdAt: '2024-03-10T09:00:00Z',
  },
  {
    id: 'msg-2',
    channelId: 'channel-1',
    userId: 'user-2',
    content: '오후 2시에 시작합니다!',
    createdAt: '2024-03-10T09:01:00Z',
  },
  {
    id: 'msg-3',
    channelId: 'channel-1',
    userId: 'user-3',
    content: '저도 참석하겠습니다.',
    createdAt: '2024-03-10T09:02:00Z',
  },
  {
    id: 'msg-4',
    channelId: 'channel-1',
    userId: 'user-4',
    content: '회의실은 3층 대회의실 맞나요?',
    createdAt: '2024-03-10T09:05:00Z',
  },
  {
    id: 'msg-5',
    channelId: 'channel-1',
    userId: 'user-1',
    content: '네 맞습니다! 자료는 미리 공유 드리겠습니다.',
    createdAt: '2024-03-10T09:06:00Z',
  },
  {
    id: 'msg-6',
    channelId: 'channel-2',
    userId: 'user-2',
    content: '오늘 점심 뭐 드실 건가요?',
    createdAt: '2024-03-10T11:30:00Z',
  },
  {
    id: 'msg-7',
    channelId: 'channel-2',
    userId: 'user-4',
    content: '김치찌개 어때요?',
    createdAt: '2024-03-10T11:31:00Z',
  },
  {
    id: 'msg-8',
    channelId: 'channel-3',
    userId: 'user-1',
    content: 'React 19 마이그레이션 관련해서 논의할 게 있습니다.',
    createdAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'msg-9',
    channelId: 'channel-3',
    userId: 'user-3',
    content: '어떤 부분이 이슈인가요?',
    createdAt: '2024-03-10T10:05:00Z',
  },
  {
    id: 'msg-10',
    channelId: 'channel-4',
    userId: 'user-2',
    content: '새 디자인 시안 피그마에 올려두었습니다.',
    createdAt: '2024-03-10T14:00:00Z',
  },
];
