// T-13: named exported interface
// T-14: discriminated union으로 variant 타입 모델링
// T-15: optional 프로퍼티 남용 금지 — 조건부 프로퍼티는 타입 분리 후 union

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// ✅ T-14: discriminated union — 폼 모드별 타입 분리
export type AuthFormMode = 'login' | 'register';

// ✅ T-14: discriminated union — 비밀번호 강도
export type PasswordStrength =
  | { level: 'empty'; score: 0 }
  | { level: 'weak'; score: number }
  | { level: 'medium'; score: number }
  | { level: 'strong'; score: number };

// ✅ T-13: 최근 로그인 사용자
export interface RecentUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}
