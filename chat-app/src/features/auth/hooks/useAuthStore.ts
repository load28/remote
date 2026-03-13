// 레퍼런스: zustand--state--client-state.md, lazy-init--local-storage--state.md
// S-08: 클라이언트 상태 Zustand로 분리
// S-01: state 직접 변경 금지 → set()으로 새 참조 생성
// S-10: lazy state 초기화 (Zustand persist 미들웨어 내부)
// S-15: localStorage 스키마 버전 관리

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types';

// ✅ P-03: 모듈 레벨 상수
const AUTH_STORAGE_KEY = 'chat-auth';
const AUTH_STORAGE_VERSION = 1; // S-15: 스키마 버전

// ✅ T-13: named exported interface
export interface AuthState {
  currentUser: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean; // N-04: Boolean is 접두사
}

export interface AuthActions {
  signIn: (user: AuthUser, token: string) => void;
  signOut: () => void;
}

// ✅ S-09: Feature 디렉토리 내 배치
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      currentUser: null,
      token: null,
      isAuthenticated: false,
      signIn: (user, token) => set({ currentUser: user, token, isAuthenticated: true }),
      signOut: () => set({ currentUser: null, token: null, isAuthenticated: false }),
    }),
    {
      name: `${AUTH_STORAGE_KEY}_v${AUTH_STORAGE_VERSION}`, // S-15: 버전 키
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
