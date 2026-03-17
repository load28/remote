// A-07: barrel file — FSD: entities에서 re-export + feature 전용 export
// P-06: named export만

// entities/user에서 re-export (도메인 모델)
export { UserProfile, useUsers, USER_QUERY_KEY } from '@/entities/user';
export type { User, UpdateProfileInput, UserProfileProps } from '@/entities/user';

// feature 전용 (사용자 인터랙션)
export { currentUserIdAtom, switchUserAtom } from './model/userAtoms';
export { useUpdateProfile } from './hooks/useUpdateProfile';
export { ProfileEditModal } from './components/ProfileEditModal';
