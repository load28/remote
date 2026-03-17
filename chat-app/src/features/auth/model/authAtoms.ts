// S-08: 클라이언트 상태 Jotai atom으로 관리
// S-01: set()으로 새 참조 생성, 직접 변경 금지
// S-15: localStorage 스키마 버전 관리

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { AuthUser } from '../types';

// P-03: 모듈 레벨 상수
const AUTH_STORAGE_KEY = 'chat-auth';
const AUTH_STORAGE_VERSION = 3; // S-15: 스키마 버전 (Jotai 전환)

// T-13: named exported interface
export interface AuthState {
  currentUser: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean; // N-04: Boolean is 접두사
  isGuest: boolean; // N-04: 게스트 여부
  guestChannelId: string | null;
}

const DEFAULT_AUTH_STATE: AuthState = {
  currentUser: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,
  guestChannelId: null,
};

// N-09: ___Atom 접미사
export const authStateAtom = atomWithStorage<AuthState>(
  `${AUTH_STORAGE_KEY}_v${AUTH_STORAGE_VERSION}`,
  DEFAULT_AUTH_STATE,
);

// derived atoms — 개별 필드 읽기 전용
export const currentUserAtom = atom((get) => get(authStateAtom).currentUser);
export const isAuthenticatedAtom = atom((get) => get(authStateAtom).isAuthenticated);
export const isGuestAtom = atom((get) => get(authStateAtom).isGuest);
export const guestChannelIdAtom = atom((get) => get(authStateAtom).guestChannelId);

// writable atom — write-only 액션
export const signInAtom = atom(
  null,
  (_get, set, { user, token }: { user: AuthUser; token: string }) => {
    set(authStateAtom, {
      currentUser: user,
      token,
      isAuthenticated: true,
      isGuest: false,
      guestChannelId: null,
    });
  },
);

export const signInAsGuestAtom = atom(
  null,
  (_get, set, { user, token, channelId }: { user: AuthUser; token: string; channelId: string }) => {
    set(authStateAtom, {
      currentUser: user,
      token,
      isAuthenticated: true,
      isGuest: true,
      guestChannelId: channelId,
    });
  },
);

export const signOutAtom = atom(
  null,
  (_get, set) => {
    set(authStateAtom, DEFAULT_AUTH_STATE);
  },
);
