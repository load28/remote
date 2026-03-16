// A-07: barrel file — FSD: entities에서 re-export + feature 전용 export
// P-06: named export만

// entities/channel에서 re-export (도메인 모델)
export { ChannelList, useChannels, CHANNEL_QUERY_KEY } from '@/entities/channel';
export type { Channel, CreateChannelInput, ChannelMember, ChannelMemberRole, ChannelAddableUser, AddChannelMemberInput, UpdateMemberRoleInput } from '@/entities/channel';

// feature 전용 (사용자 인터랙션)
export { useCreateChannel } from './hooks/useChannels';
export { ChannelMemberList } from './components/ChannelMemberList';
export { ChannelMemberPanel } from './components/ChannelMemberPanel';
export { useChannelMembers, useAddChannelMember, useRemoveChannelMember, useUpdateMemberRole, CHANNEL_MEMBER_QUERY_KEY } from './hooks/useChannelMembers';
